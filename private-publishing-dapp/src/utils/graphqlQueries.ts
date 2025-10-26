/**
 * GraphQL queries for fetching on-chain data
 * Uses Sui GraphQL API for efficient data retrieval
 */

import { suiGraphQLClient, graphql } from "../config/graphql";
import { fromBase64 } from "@mysten/sui/utils";
import type {
  Publication,
  Article,
  SubscriptionNFT,
  ReadToken,
  PublicationStats,
} from "../types";
import { Tier } from "../types";

/**
 * Fetch all Publication objects from the chain
 */
export async function fetchAllPublications(packageId: string): Promise<Publication[]> {
  const typeFilter = `${packageId}::publication::Publication`;

  const query = graphql(`
    query GetPublications($typeFilter: String!) {
      objects(
        filter: {
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
    variables: { typeFilter },
  });

  const publications: Publication[] = [];

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;
      publications.push({
        id: node.address,
        name: data.name,
        description: data.description,
        creator: data.creator,
        free_tier_enabled: data.free_tier_enabled,
        basic_price: data.basic_price,
        premium_price: data.premium_price,
        article_count: data.article_count || "0",
      });
    }
  }

  return publications;
}

/**
 * Fetch a single Publication by ID
 */
export async function fetchPublicationById(publicationId: string): Promise<Publication | null> {
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
 * Fetch all Articles for a specific publication
 */
export async function fetchArticlesByPublicationId(
  packageId: string,
  publicationId: string
): Promise<Article[]> {
  const typeFilter = `${packageId}::article::Article`;

  const query = graphql(`
    query GetArticles($typeFilter: String!) {
      objects(
        filter: {
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
    variables: { typeFilter },
  });

  const articles: Article[] = [];

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;

      // Filter by publication_id on the client side
      if (data.publication_id === publicationId) {
        // Convert base64-encoded seal_key_id to number array
        const sealKeyIdBytes = typeof data.seal_key_id === 'string'
          ? Array.from(fromBase64(data.seal_key_id))
          : data.seal_key_id;

        articles.push({
          id: node.address,
          publication_id: data.publication_id,
          title: data.title,
          excerpt: data.excerpt,
          walrus_blob_id: data.walrus_blob_id,
          seal_key_id: sealKeyIdBytes,
          tier: normalizeTier(data.tier),
          published_at: data.published_at,
          is_archived: data.is_archived || false,
        });
      }
    }
  }

  return articles;
}

/**
 * Fetch a single Article by ID
 */
export async function fetchArticleById(articleId: string): Promise<Article | null> {
  const query = graphql(`
    query GetArticle($id: SuiAddress!) {
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
    variables: { id: articleId },
  });

  const node = result.data?.object;
  if (!node?.asMoveObject?.contents?.json) {
    return null;
  }

  const data = node.asMoveObject.contents.json as any;

  // Convert base64-encoded seal_key_id to number array
  const sealKeyIdBytes = typeof data.seal_key_id === 'string'
    ? Array.from(fromBase64(data.seal_key_id))
    : data.seal_key_id;

  return {
    id: node.address,
    publication_id: data.publication_id,
    title: data.title,
    excerpt: data.excerpt,
    walrus_blob_id: data.walrus_blob_id,
    seal_key_id: sealKeyIdBytes,
    tier: normalizeTier(data.tier),
    published_at: data.published_at,
    is_archived: data.is_archived || false,
  };
}

/**
 * Normalize tier value from GraphQL response to numeric Tier enum
 */
function normalizeTier(tier: any): Tier {
  console.log('[GraphQL] Raw tier value:', tier, 'Type:', typeof tier);

  // If it's already a number, use it directly
  if (typeof tier === 'number') {
    if (tier === 0 || tier === 1 || tier === 2) {
      return tier as Tier;
    }
  }

  // If it's a string, map to enum value
  if (typeof tier === 'string') {
    const lowerTier = tier.toLowerCase();
    if (lowerTier === 'free') return Tier.Free;
    if (lowerTier === 'basic') return Tier.Basic;
    if (lowerTier === 'premium') return Tier.Premium;
  }

  // If it's an object with @variant property (GraphQL Move enum format)
  if (tier && typeof tier === 'object') {
    const variant = tier['@variant'] || tier.variant;
    if (variant) {
      const lowerVariant = variant.toLowerCase();
      if (lowerVariant === 'free') return Tier.Free;
      if (lowerVariant === 'basic') return Tier.Basic;
      if (lowerVariant === 'premium') return Tier.Premium;
    }

    // Fallback: check for property names
    if ('Free' in tier) return Tier.Free;
    if ('Basic' in tier) return Tier.Basic;
    if ('Premium' in tier) return Tier.Premium;
  }

  console.warn('[GraphQL] Unknown tier format, defaulting to Free:', tier);
  return Tier.Free;
}

/**
 * Fetch all SubscriptionNFTs owned by a user
 */
export async function fetchUserSubscriptions(
  packageId: string,
  ownerAddress: string
): Promise<SubscriptionNFT[]> {
  const typeFilter = `${packageId}::subscription::SubscriptionNFT`;

  const query = graphql(`
    query GetUserSubscriptions($typeFilter: String!, $owner: SuiAddress!) {
      objects(
        filter: {
          type: $typeFilter
          owner: $owner
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
    variables: { typeFilter, owner: ownerAddress },
  });

  const subscriptions: SubscriptionNFT[] = [];

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;
      subscriptions.push({
        id: node.address,
        publication_id: data.publication_id,
        tier: normalizeTier(data.tier),
        subscribed_at: data.subscribed_at,
        expires_at: data.expires_at,
        subscriber: data.subscriber,
      });
    }
  }

  return subscriptions;
}

/**
 * Fetch all ReadTokens owned by a user
 */
export async function fetchUserReadTokens(
  packageId: string,
  ownerAddress: string
): Promise<ReadToken[]> {
  const typeFilter = `${packageId}::access_control::ReadToken`;

  const query = graphql(`
    query GetUserReadTokens($typeFilter: String!, $owner: SuiAddress!) {
      objects(
        filter: {
          type: $typeFilter
          owner: $owner
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
    variables: { typeFilter, owner: ownerAddress },
  });

  const tokens: ReadToken[] = [];

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;
      tokens.push({
        id: node.address,
        article_id: data.article_id,
        reader: data.reader,
        created_at: data.created_at,
        expires_at: data.expires_at,
      });
    }
  }

  return tokens;
}

/**
 * Fetch PublicationStats for a publication
 */
export async function fetchPublicationStats(
  packageId: string,
  publicationId: string
): Promise<PublicationStats | null> {
  const typeFilter = `${packageId}::analytics::PublicationStats`;

  const query = graphql(`
    query GetPublicationStats($typeFilter: String!) {
      objects(
        filter: {
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
    variables: { typeFilter },
  });

  for (const node of result.data?.objects.nodes || []) {
    if (node?.asMoveObject?.contents?.json) {
      const data = node.asMoveObject.contents.json as any;

      // Filter by publication_id
      if (data.publication_id === publicationId) {
        return {
          id: node.address,
          publication_id: data.publication_id,
          total_subscribers: data.total_subscribers || "0",
          free_tier: data.free_tier || "0",
          basic_tier: data.basic_tier || "0",
          premium_tier: data.premium_tier || "0",
          total_revenue: data.total_revenue || "0",
          total_views: data.total_views || "0",
        };
      }
    }
  }

  return null;
}

/**
 * Check if a user has access to an article
 * Returns the access method (subscription or token) if user has access
 */
export async function checkUserAccess(
  packageId: string,
  userAddress: string,
  articleId: string,
  article: Article
): Promise<{ hasAccess: boolean; method?: "subscription" | "token"; objectId?: string }> {
  const now = Math.floor(Date.now() / 1000);

  // Check for subscriptions
  const subscriptions = await fetchUserSubscriptions(packageId, userAddress);
  const validSubscription = subscriptions.find((sub) => {
    // Check if subscription is for the same publication
    if (sub.publication_id !== article.publication_id) return false;

    // Check if not expired
    if (Number(sub.expires_at) <= now) return false;

    // Check if tier has access (subscription tier >= article tier)
    return sub.tier >= article.tier;
  });

  if (validSubscription) {
    return {
      hasAccess: true,
      method: "subscription",
      objectId: validSubscription.id,
    };
  }

  // Check for read tokens
  const tokens = await fetchUserReadTokens(packageId, userAddress);
  const validToken = tokens.find((token) => {
    // Check if token is for this article
    if (token.article_id !== articleId) return false;

    // Check if not expired
    return Number(token.expires_at) > now;
  });

  if (validToken) {
    return {
      hasAccess: true,
      method: "token",
      objectId: validToken.id,
    };
  }

  return { hasAccess: false };
}


/**
 * Get Seal Key ID for an article
 */
export async function getSealKeyId(articleId: string): Promise<number[]> {
  const query = graphql(`
    query GetSealKeyId($id: SuiAddress!) {
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
    variables: { id: articleId },
  });

  const node = result.data?.object;
  if (!node?.asMoveObject?.contents?.json) {
    throw new Error(`Article not found: ${articleId}`);
  }

  const data = node.asMoveObject.contents.json as any;

  // The seal_key_id field should be a base64 string from GraphQL
  if (!data.seal_key_id) {
    throw new Error(`Missing seal_key_id for article: ${articleId}`);
  }

  // Convert base64-encoded seal_key_id to number array
  const sealKeyIdBytes = typeof data.seal_key_id === 'string'
    ? Array.from(fromBase64(data.seal_key_id))
    : data.seal_key_id;

  return sealKeyIdBytes;
}
