/**
 * React Query hooks for fetching publication data from GraphQL
 */

import { useQuery } from "@tanstack/react-query";
import { useNetworkVariable } from "../networkConfig";
import {
  fetchAllPublications,
  fetchPublicationById,
  fetchArticlesByPublicationId,
  fetchPublicationStats,
} from "../utils/graphqlQueries";
import type { Publication, Article, PublicationStats, PublicationWithStats } from "../types";

/**
 * Fetch all publications from the chain
 */
export function usePublications() {
  const packageId = useNetworkVariable("packageId");

  return useQuery<Publication[], Error>({
    queryKey: ["publications", packageId],
    queryFn: () => fetchAllPublications(packageId),
    staleTime: 30_000, // 30 seconds
    enabled: packageId !== "0x0", // Only fetch if package is deployed
  });
}

/**
 * Fetch a single publication by ID
 */
export function usePublication(publicationId: string | undefined) {
  const packageId = useNetworkVariable("packageId");

  return useQuery<Publication | null, Error>({
    queryKey: ["publication", publicationId],
    queryFn: () => fetchPublicationById(publicationId!),
    staleTime: 30_000,
    enabled: !!publicationId && packageId !== "0x0",
  });
}

/**
 * Fetch all articles for a publication
 */
export function usePublicationArticles(publicationId: string | undefined) {
  const packageId = useNetworkVariable("packageId");

  return useQuery<Article[], Error>({
    queryKey: ["publication-articles", publicationId],
    queryFn: () => fetchArticlesByPublicationId(packageId, publicationId!),
    staleTime: 30_000,
    enabled: !!publicationId && packageId !== "0x0",
  });
}

/**
 * Fetch publication stats
 */
export function usePublicationStats(publicationId: string | undefined) {
  const packageId = useNetworkVariable("packageId");

  return useQuery<PublicationStats | null, Error>({
    queryKey: ["publication-stats", publicationId],
    queryFn: () => fetchPublicationStats(packageId, publicationId!),
    staleTime: 60_000, // 1 minute
    enabled: !!publicationId && packageId !== "0x0",
  });
}

/**
 * Fetch publication with stats combined
 */
export function usePublicationWithStats(publicationId: string | undefined) {
  const publication = usePublication(publicationId);
  const stats = usePublicationStats(publicationId);

  return {
    data: publication.data
      ? ({
          ...publication.data,
          stats: stats.data ?? undefined,
        } as PublicationWithStats)
      : null,
    isLoading: publication.isLoading || stats.isLoading,
    error: publication.error || stats.error,
  };
}
