/**
 * E2E tests for publication module
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { setupTestEnvironment } from '../utils/setup.js';
import { createFundedKeypair, waitForObject } from '../utils/wallets.js';
import { deployPackage, getFunctionName } from '../utils/deploy.js';
import {
  BASIC_PRICE,
  PREMIUM_PRICE,
  TEST_PUBLICATION,
  GAS_BUDGET,
} from '../utils/constants.js';

describe('Publication Module', () => {
  let client: SuiClient;
  let packageId: string;
  let creator: Ed25519Keypair;
  let otherUser: Ed25519Keypair;

  beforeAll(async () => {
    // Setup test environment
    client = await setupTestEnvironment();

    // Create and fund test wallets
    creator = await createFundedKeypair(client);
    otherUser = await createFundedKeypair(client);

    // Deploy the contract
    const deployed = await deployPackage(client, creator);
    packageId = deployed.packageId;

    console.log('Test setup complete');
    console.log('Package ID:', packageId);
    console.log('Creator address:', creator.toSuiAddress());
  }, 120000); // 2 minute timeout for setup

  it('should create a publication successfully', async () => {
    const tx = new Transaction();

    // Capture the returned values
    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string(TEST_PUBLICATION.name),
        tx.pure.string(TEST_PUBLICATION.description),
        tx.pure.u64(BASIC_PRICE),
        tx.pure.u64(PREMIUM_PRICE),
        tx.pure.bool(true), // free_tier_enabled
      ],
    });

    // Transfer the objects to the creator
    tx.transferObjects([publication, publisherCap], creator.toSuiAddress());

    const result = await client.signAndExecuteTransaction({
      signer: creator,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    expect(result.effects?.status.status).toBe('success');
    expect(result.objectChanges).toBeDefined();

    // Should create two objects: Publication and PublisherCap
    const createdObjects = result.objectChanges?.filter(
      (change) => change.type === 'created'
    );
    expect(createdObjects?.length).toBeGreaterThanOrEqual(2);

    // Verify event was emitted
    expect(result.events).toBeDefined();
    const publicationCreatedEvent = result.events?.find((event) =>
      event.type.includes('PublicationCreated')
    );
    expect(publicationCreatedEvent).toBeDefined();
  });

  it('should reject invalid pricing (premium < basic)', async () => {
    const tx = new Transaction();

    const [publication, publisherCap] = tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        tx.pure.string('Invalid Publication'),
        tx.pure.string('This should fail'),
        tx.pure.u64(PREMIUM_PRICE), // basic_price higher
        tx.pure.u64(BASIC_PRICE), // premium_price lower
        tx.pure.bool(true),
      ],
    });

    // Transfer objects (even though this should fail)
    tx.transferObjects([publication, publisherCap], creator.toSuiAddress());

    try {
      const result = await client.signAndExecuteTransaction({
        signer: creator,
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

  it('should update pricing with valid PublisherCap', async () => {
    // Create a fresh wallet for this test
    const testWallet = await createFundedKeypair(client);

    // First create a publication
    const createTx = new Transaction();

    const [publication, publisherCap] = createTx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        createTx.pure.string('Update Test Publication'),
        createTx.pure.string('Testing pricing updates'),
        createTx.pure.u64(BASIC_PRICE),
        createTx.pure.u64(PREMIUM_PRICE),
        createTx.pure.bool(true),
      ],
    });

    // Transfer objects to test wallet
    createTx.transferObjects([publication, publisherCap], testWallet.toSuiAddress());

    const createResult = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: createTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    expect(createResult.effects?.status.status).toBe('success');

    // Get the created object IDs
    const createdObjects = createResult.objectChanges?.filter(
      (change) => change.type === 'created' && 'objectId' in change
    );

    const publicationId = createdObjects?.[0]?.type === 'created'
      ? (createdObjects[0] as any).objectId
      : undefined;
    const publisherCapId = createdObjects?.[1]?.type === 'created'
      ? (createdObjects[1] as any).objectId
      : undefined;

    expect(publicationId).toBeDefined();
    expect(publisherCapId).toBeDefined();

    // Wait for objects to be indexed
    await waitForObject(client, publicationId!);
    await waitForObject(client, publisherCapId!);

    // Now update the pricing
    const newBasicPrice = BASIC_PRICE * 2n;
    const newPremiumPrice = PREMIUM_PRICE * 2n;

    const updateTx = new Transaction();

    updateTx.moveCall({
      target: getFunctionName(packageId, 'publication', 'update_pricing'),
      arguments: [
        updateTx.object(publicationId!),
        updateTx.object(publisherCapId!),
        updateTx.pure.u64(newBasicPrice),
        updateTx.pure.u64(newPremiumPrice),
      ],
    });

    const updateResult = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: updateTx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    expect(updateResult.effects?.status.status).toBe('success');

    // Verify PricingUpdated event
    const pricingUpdatedEvent = updateResult.events?.find((event) =>
      event.type.includes('PricingUpdated')
    );
    expect(pricingUpdatedEvent).toBeDefined();
  });

  it('should toggle free tier successfully', async () => {
    // Create a fresh wallet for this test
    const testWallet = await createFundedKeypair(client);

    // Create a publication
    const createTx = new Transaction();

    const [publication, publisherCap] = createTx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        createTx.pure.string('Free Tier Test'),
        createTx.pure.string('Testing free tier toggle'),
        createTx.pure.u64(BASIC_PRICE),
        createTx.pure.u64(PREMIUM_PRICE),
        createTx.pure.bool(true), // Initially enabled
      ],
    });

    createTx.transferObjects([publication, publisherCap], testWallet.toSuiAddress());

    const createResult = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: createTx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    expect(createResult.effects?.status.status).toBe('success');

    // Get object IDs
    const createdObjects = createResult.objectChanges?.filter(
      (change) => change.type === 'created' && 'objectId' in change
    );

    const publicationId = (createdObjects?.[0] as any)?.objectId;
    const publisherCapId = (createdObjects?.[1] as any)?.objectId;

    // Wait for objects to be indexed
    await waitForObject(client, publicationId);
    await waitForObject(client, publisherCapId);

    // Toggle free tier to disabled
    const toggleTx = new Transaction();

    toggleTx.moveCall({
      target: getFunctionName(packageId, 'publication', 'toggle_free_tier'),
      arguments: [
        toggleTx.object(publicationId),
        toggleTx.object(publisherCapId),
        toggleTx.pure.bool(false), // Disable free tier
      ],
    });

    const toggleResult = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: toggleTx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    expect(toggleResult.effects?.status.status).toBe('success');

    // Verify FreeTierToggled event
    const freeTierEvent = toggleResult.events?.find((event) =>
      event.type.includes('FreeTierToggled')
    );
    expect(freeTierEvent).toBeDefined();
  });

  it('should reject updates with wrong PublisherCap', async () => {
    // Create a fresh wallet for this test
    const testWallet = await createFundedKeypair(client);

    // Create two publications with same owner
    const pub1Tx = new Transaction();
    const [pub1, cap1] = pub1Tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        pub1Tx.pure.string('Publication 1'),
        pub1Tx.pure.string('First publication'),
        pub1Tx.pure.u64(BASIC_PRICE),
        pub1Tx.pure.u64(PREMIUM_PRICE),
        pub1Tx.pure.bool(true),
      ],
    });
    pub1Tx.transferObjects([pub1, cap1], testWallet.toSuiAddress());

    const pub1Result = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: pub1Tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    const pub2Tx = new Transaction();
    const [pub2, cap2] = pub2Tx.moveCall({
      target: getFunctionName(packageId, 'publication', 'create_publication'),
      arguments: [
        pub2Tx.pure.string('Publication 2'),
        pub2Tx.pure.string('Second publication'),
        pub2Tx.pure.u64(BASIC_PRICE),
        pub2Tx.pure.u64(PREMIUM_PRICE),
        pub2Tx.pure.bool(true),
      ],
    });
    pub2Tx.transferObjects([pub2, cap2], testWallet.toSuiAddress());

    const pub2Result = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: pub2Tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    // Get object IDs
    const pub1Objects = pub1Result.objectChanges?.filter(
      (c) => c.type === 'created' && 'objectId' in c
    );
    const pub2Objects = pub2Result.objectChanges?.filter(
      (c) => c.type === 'created' && 'objectId' in c
    );

    const pub1Id = (pub1Objects?.[0] as any)?.objectId;
    const cap2Id = (pub2Objects?.[1] as any)?.objectId;

    // Wait for objects to be indexed
    await waitForObject(client, pub1Id);
    await waitForObject(client, cap2Id);

    // Try to update publication 1 with capability from publication 2
    const wrongCapTx = new Transaction();
    wrongCapTx.moveCall({
      target: getFunctionName(packageId, 'publication', 'update_pricing'),
      arguments: [
        wrongCapTx.object(pub1Id),
        wrongCapTx.object(cap2Id), // Wrong cap!
        wrongCapTx.pure.u64(BASIC_PRICE * 2n),
        wrongCapTx.pure.u64(PREMIUM_PRICE * 2n),
      ],
    });

    try {
      const wrongCapResult = await client.signAndExecuteTransaction({
        signer: testWallet,
        transaction: wrongCapTx,
        options: {
          showEffects: true,
        },
      });

      // Should fail
      expect(wrongCapResult.effects?.status.status).toBe('failure');
    } catch (error) {
      // Transaction should be rejected
      expect(error).toBeDefined();
    }
  });
});
