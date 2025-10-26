/**
 * Sui GraphQL Client Configuration
 * Used for querying on-chain data efficiently
 */

import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

// GraphQL endpoint for testnet
const TESTNET_GRAPHQL_URL = "https://graphql.testnet.sui.io/graphql";

/**
 * Configured GraphQL client for Sui testnet
 * Used throughout the app for querying publications, subscriptions, articles, etc.
 */
export const suiGraphQLClient = new SuiGraphQLClient({
  url: TESTNET_GRAPHQL_URL,
});

// Export the graphql template tag for type-safe queries
export { graphql };
