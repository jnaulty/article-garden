/**
 * React Query hooks for checking article access permissions
 */

import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { fetchUserReadTokens, fetchArticleById, checkUserAccess } from "../utils/graphqlQueries";
import type { ReadToken, Article } from "../types";

/**
 * Fetch all read tokens owned by the current user
 */
export function useUserReadTokens() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery<ReadToken[], Error>({
    queryKey: ["user-read-tokens", account?.address],
    queryFn: () => fetchUserReadTokens(packageId, account!.address),
    staleTime: 30_000,
    enabled: !!account?.address && packageId !== "0x0",
  });
}

/**
 * Check if user has access to a specific article
 * Returns access status and method (subscription or token)
 */
export function useArticleAccess(articleId: string | undefined) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery<
    { hasAccess: boolean; method?: "subscription" | "token"; objectId?: string },
    Error
  >({
    queryKey: ["article-access", articleId, account?.address],
    queryFn: async () => {
      if (!account?.address || !articleId) {
        return { hasAccess: false };
      }

      // Fetch article to get tier info
      const article = await fetchArticleById(articleId);
      if (!article) {
        return { hasAccess: false };
      }

      return checkUserAccess(packageId, account.address, articleId, article);
    },
    staleTime: 10_000, // 10 seconds (more frequent for access checks)
    enabled: !!account?.address && !!articleId && packageId !== "0x0",
  });
}

/**
 * Get active (non-expired) read tokens
 */
export function useActiveReadTokens() {
  const tokens = useUserReadTokens();
  const now = Math.floor(Date.now() / 1000);

  const activeTokens = tokens.data?.filter((token) => {
    return Number(token.expires_at) > now;
  });

  return {
    data: activeTokens || [],
    isLoading: tokens.isLoading,
    error: tokens.error,
  };
}

/**
 * Get read token for a specific article (if exists and not expired)
 */
export function useArticleReadToken(articleId: string | undefined) {
  const tokens = useUserReadTokens();
  const now = Math.floor(Date.now() / 1000);

  const articleToken = tokens.data?.find((token) => {
    return token.article_id === articleId && Number(token.expires_at) > now;
  });

  return {
    data: articleToken || null,
    hasToken: !!articleToken,
    isLoading: tokens.isLoading,
    error: tokens.error,
  };
}

/**
 * Fetch article with access information combined
 */
export function useArticleWithAccess(articleId: string | undefined) {
  const articleQuery = useQuery<Article | null, Error>({
    queryKey: ["article", articleId],
    queryFn: () => fetchArticleById(articleId!),
    staleTime: 30_000,
    enabled: !!articleId,
  });

  const accessQuery = useArticleAccess(articleId);

  return {
    data: articleQuery.data
      ? {
          ...articleQuery.data,
          hasAccess: accessQuery.data?.hasAccess || false,
          accessMethod: accessQuery.data?.method,
        }
      : null,
    isLoading: articleQuery.isLoading || accessQuery.isLoading,
    error: articleQuery.error || accessQuery.error,
  };
}
