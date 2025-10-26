/**
 * Shared constants for E2E tests
 */

// Network configuration
// Option 1: Localnet on custom ports (avoids Docker conflicts)
// Run: sui start --force-regenesis --fullnode-rpc-port=9500 --with-faucet=0.0.0.0:9523
export const LOCALNET_URL = 'http://127.0.0.1:9500';
export const FAUCET_URL = 'http://127.0.0.1:9523/gas';

// Option 2: Testnet (slower but doesn't require local network)
// export const LOCALNET_URL = 'https://fullnode.testnet.sui.io:443';
// export const FAUCET_URL = 'https://faucet.testnet.sui.io/gas';

// Test subscription pricing (in MIST - 1 SUI = 1_000_000_000 MIST)
export const BASIC_PRICE = 1_000_000_000n; // 1 SUI
export const PREMIUM_PRICE = 5_000_000_000n; // 5 SUI

// Time constants
export const SECONDS_PER_MONTH = 30 * 24 * 60 * 60; // 30 days in seconds
export const SECONDS_PER_DAY = 24 * 60 * 60; // 1 day in seconds
export const MS_PER_SECOND = 1000;

// Subscription tiers (matching Move enum values)
export enum Tier {
  Free = 0,
  Basic = 1,
  Premium = 2,
}

// Royalty constants
export const DEFAULT_ROYALTY_BPS = 1000; // 10% (1000 basis points)
export const MAX_BPS = 10000; // 100% (10000 basis points)

// Test data
export const TEST_PUBLICATION = {
  name: 'Test Publication',
  description: 'A test publication for E2E testing',
};

export const TEST_ARTICLE = {
  title: 'Test Article',
  excerpt: 'This is a test article excerpt',
  walrusBlobId: 'test-blob-id-12345',
  sealKeyId: 'test-seal-key-id-67890',
};

// Gas budget for transactions
export const GAS_BUDGET = 100_000_000; // 0.1 SUI
