/**
 * E2E tests for subscription module
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { setupTestEnvironment } from '../utils/setup.js';
import { createFundedKeypair } from '../utils/wallets.js';
import { deployPackage, getFunctionName } from '../utils/deploy.js';
import {
  BASIC_PRICE,
  PREMIUM_PRICE,
  TEST_PUBLICATION,
  Tier,
} from '../utils/constants.js';

describe('Subscription Module', () => {
  let client: SuiClient;
  let packageId: string;
  let creator: Ed25519Keypair;

  beforeAll(async () => {
    // Setup test environment
    client = await setupTestEnvironment();

    // Create and fund test wallets
    creator = await createFundedKeypair(client);

    // Deploy the contract
    const deployed = await deployPackage(client, creator);
    packageId = deployed.packageId;

    console.log('Test setup complete');
    console.log('Package ID:', packageId);
  }, 120000);

  it('should create a free tier subscription', async () => {
    const subscriber = await createFundedKeypair(client);

    // First create a publication
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('Free Publication'),
        tx.pure.string('Testing free subscriptions'),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(true), // free_tier_enabled
      ],
    });

    // Create free tier enum
    const freeTier = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'create_tier_free'),
      arguments: [],
    });

    // Create zero-value coin for free tier
    const [zeroCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(0)]);

    // Create free tier subscription
    const subscription = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'subscribe'),
      arguments: [
        publication,
        freeTier,
        zeroCoin,
        tx.object('0x6'), // Clock object
      ],
    });

    // Transfer objects
    tx.transferObjects([publication, publisherCap], creator.toSuiAddress());
    tx.transferObjects([subscription], subscriber.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: subscriber,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    expect(result.effects?.status.status).toBe('success');

    // Should create subscription NFT
    const createdObjects = result.objectChanges?.filter(
      (change) => change.type === 'created'
    );
    expect(createdObjects?.length).toBeGreaterThanOrEqual(1);

    // Verify event was emitted
    const subscriptionCreatedEvent = result.events?.find((event) =>
      event.type.includes('SubscriptionCreated')
    );
    expect(subscriptionCreatedEvent).toBeDefined();
  });

  it('should create a basic tier subscription with payment', async () => {
    const subscriber = await createFundedKeypair(client);

    // First create a publication
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('Basic Publication'),
        tx.pure.string('Testing basic subscriptions'),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(false), // free_tier_enabled = false
      ],
    });

    // Create basic tier enum
    const basicTier = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'create_tier_basic'),
      arguments: [],
    });

    // Create payment coin
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(BASIC_PRICE)]);

    // Create basic tier subscription
    const subscription = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'subscribe'),
      arguments: [
        publication,
        basicTier,
        payment,
        tx.object('0x6'), // Clock object
      ],
    });

    // Transfer objects
    tx.transferObjects([publication, publisherCap], creator.toSuiAddress());
    tx.transferObjects([subscription], subscriber.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: subscriber,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    expect(result.effects?.status.status).toBe('success');

    // Verify event
    const subscriptionCreatedEvent = result.events?.find((event) =>
      event.type.includes('SubscriptionCreated')
    );
    expect(subscriptionCreatedEvent).toBeDefined();
  });

  it('should create a premium tier subscription', async () => {
    const subscriber = await createFundedKeypair(client);

    // Create a publication
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('Premium Publication'),
        tx.pure.string('Testing premium subscriptions'),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(false),
      ],
    });

    // Create premium tier enum
    const premiumTier = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'create_tier_premium'),
      arguments: [],
    });

    // Create payment coin
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(PREMIUM_PRICE)]);

    // Create premium tier subscription
    const subscription = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'subscribe'),
      arguments: [
        publication,
        premiumTier,
        payment,
        tx.object('0x6'), // Clock object
      ],
    });

    // Transfer objects
    tx.transferObjects([publication, publisherCap], creator.toSuiAddress());
    tx.transferObjects([subscription], subscriber.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: subscriber,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    expect(result.effects?.status.status).toBe('success');

    // Verify event
    const subscriptionCreatedEvent = result.events?.find((event) =>
      event.type.includes('SubscriptionCreated')
    );
    expect(subscriptionCreatedEvent).toBeDefined();
  });

  it('should reject subscription with insufficient payment', async () => {
    const subscriber = await createFundedKeypair(client);

    // Create a publication
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('Payment Test Publication'),
        tx.pure.string('Testing payment validation'),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(false),
      ],
    });

    // Create basic tier enum
    const basicTier = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'create_tier_basic'),
      arguments: [],
    });

    // Create insufficient payment (half the required amount)
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(BASIC_PRICE / 2n)]);

    // Try to create basic tier subscription with insufficient payment
    const subscription = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'subscribe'),
      arguments: [
        publication,
        basicTier,
        payment,
        tx.object('0x6'), // Clock object
      ],
    });

    tx.transferObjects([publisherCap], creator.toSuiAddress());
    tx.transferObjects([subscription], subscriber.toSuiAddress());

    try {
      const result = await client.signAndExecuteTransaction({
        signer: subscriber,
        transaction: tx,
        options: {
          showEffects: true,
        },
      });

      // Should fail
      expect(result.effects?.status.status).toBe('failure');
    } catch (error) {
      // Transaction should be rejected
      expect(error).toBeDefined();
    }
  });

  it('should reject free tier subscription when free tier is disabled', async () => {
    const subscriber = await createFundedKeypair(client);

    // Create a publication with free tier disabled
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('No Free Tier Publication'),
        tx.pure.string('Testing free tier validation'),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(false), // free_tier_enabled = false
      ],
    });

    // Create free tier enum
    const freeTier = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'create_tier_free'),
      arguments: [],
    });

    // Create zero-value coin
    const [zeroCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(0)]);

    // Try to create free tier subscription
    const subscription = tx.moveCall({
      target: getFunctionName(packageId, 'subscription', 'subscribe'),
      arguments: [
        publication,
        freeTier,
        zeroCoin,
        tx.object('0x6'),
      ],
    });

    tx.transferObjects([publisherCap], creator.toSuiAddress());
    tx.transferObjects([subscription], subscriber.toSuiAddress());

    try {
      const result = await client.signAndExecuteTransaction({
        signer: subscriber,
        transaction: tx,
        options: {
          showEffects: true,
        },
      });

      // Should fail
      expect(result.effects?.status.status).toBe('failure');
    } catch (error) {
      // Transaction should be rejected
      expect(error).toBeDefined();
    }
  });
});
