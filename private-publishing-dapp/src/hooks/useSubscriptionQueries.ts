/**
 * React Query hooks for fetching subscription data from GraphQL
 */

import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { fetchUserSubscriptions, fetchPublicationById } from "../utils/graphqlQueries";
import type { SubscriptionNFT, SubscriptionWithPublication } from "../types";

/**
 * Fetch all subscriptions owned by the current user
 */
export function useUserSubscriptions() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery<SubscriptionNFT[], Error>({
    queryKey: ["user-subscriptions", account?.address],
    queryFn: () => fetchUserSubscriptions(packageId, account!.address),
    staleTime: 30_000,
    enabled: !!account?.address && packageId !== "0x0",
  });
}

/**
 * Fetch subscriptions with publication details
 */
export function useUserSubscriptionsWithPublications() {
  const subscriptions = useUserSubscriptions();
  const packageId = useNetworkVariable("packageId");

  return useQuery<SubscriptionWithPublication[], Error>({
    queryKey: ["user-subscriptions-with-publications", subscriptions.data],
    queryFn: async () => {
      if (!subscriptions.data) return [];

      const subsWithPubs = await Promise.all(
        subscriptions.data.map(async (sub) => {
          const publication = await fetchPublicationById(sub.publication_id);
          return {
            ...sub,
            publication: publication ?? undefined,
          } as SubscriptionWithPublication;
        })
      );

      return subsWithPubs;
    },
    staleTime: 30_000,
    enabled: !!subscriptions.data && subscriptions.data.length > 0 && packageId !== "0x0",
  });
}

/**
 * Check if user has an active subscription to a specific publication
 * Returns the subscription if it exists and is valid
 */
export function useSubscriptionStatus(publicationId: string | undefined) {
  const subscriptions = useUserSubscriptions();
  const now = Math.floor(Date.now() / 1000);

  // Find active subscription for this publication
  const activeSubscription = subscriptions.data?.find((sub) => {
    return sub.publication_id === publicationId && Number(sub.expires_at) > now;
  });

  return {
    data: activeSubscription || null,
    isSubscribed: !!activeSubscription,
    isLoading: subscriptions.isLoading,
    error: subscriptions.error,
  };
}

/**
 * Get all active subscriptions (not expired)
 */
export function useActiveSubscriptions() {
  const subscriptions = useUserSubscriptions();
  const now = Math.floor(Date.now() / 1000);

  const activeSubscriptions = subscriptions.data?.filter((sub) => {
    return Number(sub.expires_at) > now;
  });

  return {
    data: activeSubscriptions || [],
    isLoading: subscriptions.isLoading,
    error: subscriptions.error,
  };
}

/**
 * Get all expired subscriptions
 */
export function useExpiredSubscriptions() {
  const subscriptions = useUserSubscriptions();
  const now = Math.floor(Date.now() / 1000);

  const expiredSubscriptions = subscriptions.data?.filter((sub) => {
    return Number(sub.expires_at) <= now;
  });

  return {
    data: expiredSubscriptions || [],
    isLoading: subscriptions.isLoading,
    error: subscriptions.error,
  };
}
