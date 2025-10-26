/**
 * React Query hooks for fetching publisher capabilities and their publications
 */

import { useQuery } from "@tanstack/react-query";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { suiGraphQLClient, graphql } from "../config/graphql";
import type { PublisherCap, Publication } from "../types";

interface PublisherPublication {
  publication: Publication;
  capId: string;
  statsId?: string; // TODO: Fetch from PublicationStats when analytics is ready
}

/**
 * Fetch all PublisherCap objects owned by the current user
 */
async function fetchPublisherCaps(
  ownerAddress: string,
  packageId: string
): Promise<PublisherCap[]> {
  const typeFilter = `${packageId}::publication::PublisherCap`;

  const query = graphql(`
    query GetPublisherCaps($owner: SuiAddress!, $typeFilter: String!) {
      objects(
        filter: {
          owner: $owner
          type: $typeFilter
        }
      ) {
        nodes {
          address
          asMoveObject {
            contents {
              json
            }
          }
        }
      }
    }
  `);

  const result = await suiGraphQLClient.query({
    query,
    variables: { owner: ownerAddress, typeFilter },
  });

  const caps: PublisherCap[] = [];

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;
      caps.push({
        id: node.address,
        publication_id: data.publication_id,
      });
    }
  }

  return caps;
}

/**
 * Fetch a Publication by its ID
 */
async function fetchPublicationById(publicationId: string): Promise<Publication | null> {
  const query = graphql(`
    query GetPublication($id: SuiAddress!) {
      object(address: $id) {
        address
        asMoveObject {
          contents {
            json
          }
        }
      }
    }
  `);

  const result = await suiGraphQLClient.query({
    query,
    variables: { id: publicationId },
  });

  const node = result.data?.object;
  if (!node?.asMoveObject?.contents?.json) {
    return null;
  }

  const data = node.asMoveObject.contents.json as any;
  return {
    id: node.address,
    name: data.name,
    description: data.description,
    creator: data.creator,
    free_tier_enabled: data.free_tier_enabled,
    basic_price: data.basic_price,
    premium_price: data.premium_price,
    article_count: data.article_count || "0",
  };
}

/**
 * Hook to fetch all PublisherCap objects owned by the current user
 */
export function usePublisherCaps() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  return useQuery<PublisherCap[], Error>({
    queryKey: ["publisher-caps", account?.address, packageId],
    queryFn: () => fetchPublisherCaps(account!.address, packageId),
    staleTime: 30_000, // 30 seconds
    enabled: !!account?.address && packageId !== "0x0",
  });
}

/**
 * Hook to fetch all publications owned by the current user
 * Returns publications along with their corresponding PublisherCap IDs
 */
export function usePublisherPublications() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const { data: caps, isLoading: capsLoading } = usePublisherCaps();

  return useQuery<PublisherPublication[], Error>({
    queryKey: ["publisher-publications", account?.address, packageId, caps],
    queryFn: async () => {
      if (!caps || caps.length === 0) {
        return [];
      }

      // Fetch all publications in parallel
      const publicationPromises = caps.map(async (cap) => {
        const publication = await fetchPublicationById(cap.publication_id);
        if (!publication) {
          return null;
        }

        return {
          publication,
          capId: cap.id,
          // TODO: Fetch statsId when analytics module is ready
          statsId: undefined,
        } as PublisherPublication;
      });

      const results = await Promise.all(publicationPromises);

      // Filter out any failed fetches
      return results.filter((p): p is PublisherPublication => p !== null);
    },
    staleTime: 30_000,
    enabled: !!account?.address && packageId !== "0x0" && !capsLoading && !!caps,
  });
}
