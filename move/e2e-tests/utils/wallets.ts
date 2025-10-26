/**
 * Wallet and keypair management for E2E tests
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui/faucet';
import { FAUCET_URL } from './constants.js';

/**
 * Create a new Ed25519 keypair for testing
 */
export function createTestKeypair(): Ed25519Keypair {
  return new Ed25519Keypair();
}

/**
 * Fund a test address with SUI from the local faucet
 */
export async function fundAddress(client: SuiClient, address: string): Promise<void> {
  try {
    // Use the Sui SDK's faucet request method for local network
    await requestSuiFromFaucetV0({
      host: FAUCET_URL,
      recipient: address,
    });

    // Wait for balance to update
    await waitForBalance(client, address);
  } catch (error) {
    console.error('Failed to fund address:', error);
    throw error;
  }
}

/**
 * Wait for an address to have a non-zero balance
 */
async function waitForBalance(
  client: SuiClient,
  address: string,
  maxRetries = 10,
  delayMs = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const balance = await client.getBalance({ owner: address });
    if (BigInt(balance.totalBalance) > 0n) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Address ${address} did not receive funds after ${maxRetries} retries`);
}

/**
 * Get the balance of an address in MIST
 */
export async function getBalance(client: SuiClient, address: string): Promise<bigint> {
  const balance = await client.getBalance({ owner: address });
  return BigInt(balance.totalBalance);
}

/**
 * Create and fund a test keypair
 */
export async function createFundedKeypair(client: SuiClient): Promise<Ed25519Keypair> {
  const keypair = createTestKeypair();
  const address = keypair.toSuiAddress();
  await fundAddress(client, address);
  return keypair;
}

/**
 * Create multiple funded keypairs for testing
 */
export async function createFundedKeypairs(
  client: SuiClient,
  count: number
): Promise<Ed25519Keypair[]> {
  const keypairs: Ed25519Keypair[] = [];
  for (let i = 0; i < count; i++) {
    const keypair = await createFundedKeypair(client);
    keypairs.push(keypair);
  }
  return keypairs;
}

/**
 * Wait for an object to be available on-chain
 */
export async function waitForObject(
  client: SuiClient,
  objectId: string,
  maxRetries = 10,
  delayMs = 500
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.getObject({ id: objectId });
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Object ${objectId} not available after ${maxRetries} retries`);
}
