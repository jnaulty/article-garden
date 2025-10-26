/**
 * Test environment setup and SuiClient initialization
 */

import { SuiClient, SuiHTTPTransport } from '@mysten/sui/client';
import { LOCALNET_URL } from './constants.js';

/**
 * Create a SuiClient for local testing
 */
export function createLocalClient(): SuiClient {
  return new SuiClient({
    transport: new SuiHTTPTransport({
      url: LOCALNET_URL,
      WebSocketConstructor: WebSocket as never,
    }),
  });
}

/**
 * Verify the local network is running and accessible
 */
export async function verifyNetwork(client: SuiClient): Promise<void> {
  try {
    await client.getChainIdentifier();
  } catch (error) {
    throw new Error(
      `Failed to connect to local Sui network at ${LOCALNET_URL}. ` +
      'Make sure to start the local network with: sui start'
    );
  }
}

/**
 * Get package ID from published modules
 * This will be populated after deployment
 */
export interface TestContext {
  client: SuiClient;
  packageId: string;
}

/**
 * Setup test environment
 */
export async function setupTestEnvironment(): Promise<SuiClient> {
  const client = createLocalClient();
  await verifyNetwork(client);
  return client;
}
