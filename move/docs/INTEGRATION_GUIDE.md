# Integration Guide

Complete guide for integrating the private publishing smart contracts with a frontend application.

## Table of Contents

- [Setup](#setup)
- [Basic Operations](#basic-operations)
- [Publication Management](#publication-management)
- [Subscription Management](#subscription-management)
- [Article Management](#article-management)
- [Access Control](#access-control)
- [Analytics](#analytics)
- [Treasury Operations](#treasury-operations)
- [Advanced Patterns](#advanced-patterns)

---

## Setup

### Install Dependencies

```bash
npm install @mysten/sui @mysten/dapp-kit
```

### Configure Sui Client

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';

// Initialize client
const client = new SuiClient({
  url: getFullnodeUrl('testnet'), // or 'mainnet', 'localnet'
});

// Package configuration
const PACKAGE_ID = process.env.VITE_PACKAGE_ID!;
const CLOCK_ID = '0x6'; // Shared clock object
```

### React Integration

```typescript
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

function MyComponent() {
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Your component logic
}
```

---

## Basic Operations

### Creating a Transaction

```typescript
function buildTransaction() {
  const txb = new TransactionBlock();

  // Add move calls
  txb.moveCall({
    target: `${PACKAGE_ID}::publication::create_publication`,
    arguments: [
      /* ... */
    ],
  });

  return txb;
}
```

### Signing and Executing

```typescript
async function executeTransaction(txb: TransactionBlock) {
  try {
    const result = await signAndExecute(
      {
        transaction: txb,
      },
      {
        onSuccess: (result) => {
          console.log('Success:', result.digest);
        },
        onError: (error) => {
          console.error('Error:', error);
        },
      }
    );

    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

### Querying Objects

```typescript
// Get object by ID
const object = await client.getObject({
  id: objectId,
  options: {
    showContent: true,
    showOwner: true,
  },
});

// Get multiple objects
const objects = await client.multiGetObjects({
  ids: [id1, id2, id3],
  options: { showContent: true },
});

// Query objects owned by address
const ownedObjects = await client.getOwnedObjects({
  owner: address,
  filter: {
    StructType: `${PACKAGE_ID}::publication::Publication`,
  },
});
```

---

## Publication Management

### Create Publication

```typescript
interface CreatePublicationParams {
  name: string;
  description: string;
  basicPrice: bigint; // in MIST
  premiumPrice: bigint; // in MIST
  freeTierEnabled: boolean;
}

async function createPublication(params: CreatePublicationParams) {
  const txb = new TransactionBlock();

  const [publication, publisherCap] = txb.moveCall({
    target: `${PACKAGE_ID}::publication::create_publication`,
    arguments: [
      txb.pure.string(params.name),
      txb.pure.string(params.description),
      txb.pure.u64(params.basicPrice),
      txb.pure.u64(params.premiumPrice),
      txb.pure.bool(params.freeTierEnabled),
    ],
  });

  // Create analytics
  const [stats] = txb.moveCall({
    target: `${PACKAGE_ID}::analytics::create_stats`,
    arguments: [publication, publisherCap],
  });

  // Transfer objects to sender
  const sender = await client.getActiveAddress();
  txb.transferObjects([publication, publisherCap, stats], txb.pure.address(sender));

  return executeTransaction(txb);
}

// Usage
const result = await createPublication({
  name: 'Tech Weekly',
  description: 'Weekly tech insights',
  basicPrice: 5_000_000_000n, // 5 SUI
  premiumPrice: 15_000_000_000n, // 15 SUI
  freeTierEnabled: true,
});
```

### Update Pricing

```typescript
interface UpdatePricingParams {
  publicationId: string;
  publisherCapId: string;
  basicPrice: bigint;
  premiumPrice: bigint;
}

async function updatePricing(params: UpdatePricingParams) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::publication::update_pricing`,
    arguments: [
      txb.object(params.publicationId),
      txb.object(params.publisherCapId),
      txb.pure.u64(params.basicPrice),
      txb.pure.u64(params.premiumPrice),
    ],
  });

  return executeTransaction(txb);
}
```

### Toggle Free Tier

```typescript
async function toggleFreeTier(
  publicationId: string,
  publisherCapId: string,
  enabled: boolean
) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::publication::toggle_free_tier`,
    arguments: [
      txb.object(publicationId),
      txb.object(publisherCapId),
      txb.pure.bool(enabled),
    ],
  });

  return executeTransaction(txb);
}
```

### Query Publication

```typescript
interface Publication {
  id: string;
  name: string;
  description: string;
  creator: string;
  freeTierEnabled: boolean;
  basicPrice: string;
  premiumPrice: string;
  articleCount: string;
}

async function getPublication(publicationId: string): Promise<Publication> {
  const object = await client.getObject({
    id: publicationId,
    options: { showContent: true },
  });

  if (object.data?.content?.dataType !== 'moveObject') {
    throw new Error('Invalid publication object');
  }

  const fields = object.data.content.fields as any;

  return {
    id: publicationId,
    name: fields.name,
    description: fields.description,
    creator: fields.creator,
    freeTierEnabled: fields.free_tier_enabled,
    basicPrice: fields.basic_price,
    premiumPrice: fields.premium_price,
    articleCount: fields.article_count,
  };
}
```

---

## Subscription Management

### Subscribe to Publication

```typescript
enum Tier {
  Free = 0,
  Basic = 1,
  Premium = 2,
}

interface SubscribeParams {
  publicationId: string;
  tier: Tier;
  paymentAmount: bigint; // in MIST
  statsId?: string; // Optional for analytics tracking
}

async function subscribe(params: SubscribeParams) {
  const txb = new TransactionBlock();

  // Split coins for payment
  const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(params.paymentAmount)]);

  // Subscribe
  const [subscription] = txb.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe`,
    arguments: [
      txb.object(params.publicationId),
      txb.pure.u8(params.tier),
      coin,
      txb.object(CLOCK_ID),
    ],
  });

  // Optional: Record analytics
  if (params.statsId) {
    txb.moveCall({
      target: `${PACKAGE_ID}::analytics::record_subscription`,
      arguments: [txb.object(params.statsId), txb.pure.u8(params.tier)],
    });

    // Record revenue if not free
    if (params.tier !== Tier.Free) {
      txb.moveCall({
        target: `${PACKAGE_ID}::analytics::record_revenue`,
        arguments: [txb.object(params.statsId), txb.pure.u64(params.paymentAmount)],
      });
    }
  }

  // Transfer subscription to user
  const sender = await client.getActiveAddress();
  txb.transferObjects([subscription], txb.pure.address(sender));

  return executeTransaction(txb);
}

// Usage - Subscribe to Basic tier
await subscribe({
  publicationId: '0x...',
  tier: Tier.Basic,
  paymentAmount: 5_000_000_000n, // 5 SUI
  statsId: '0x...', // Optional
});
```

### Renew Subscription

```typescript
interface RenewParams {
  subscriptionId: string;
  publicationId: string;
  paymentAmount: bigint;
}

async function renewSubscription(params: RenewParams) {
  const txb = new TransactionBlock();

  const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(params.paymentAmount)]);

  txb.moveCall({
    target: `${PACKAGE_ID}::subscription::renew`,
    arguments: [
      txb.object(params.subscriptionId),
      txb.object(params.publicationId),
      coin,
      txb.object(CLOCK_ID),
    ],
  });

  return executeTransaction(txb);
}
```

### Check Subscription Validity

```typescript
async function isSubscriptionValid(subscriptionId: string): Promise<boolean> {
  const txb = new TransactionBlock();

  const result = txb.moveCall({
    target: `${PACKAGE_ID}::subscription::is_valid`,
    arguments: [txb.object(subscriptionId), txb.object(CLOCK_ID)],
  });

  // Note: This requires dev inspect or simulation
  const simulation = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: await client.getActiveAddress(),
  });

  // Parse result
  return simulation.results?.[0]?.returnValues?.[0]?.[0] === 1;
}
```

### Get User Subscriptions

```typescript
async function getUserSubscriptions(userAddress: string) {
  const objects = await client.getOwnedObjects({
    owner: userAddress,
    filter: {
      StructType: `${PACKAGE_ID}::subscription::SubscriptionNFT`,
    },
    options: { showContent: true },
  });

  return objects.data.map((obj) => {
    if (obj.data?.content?.dataType !== 'moveObject') return null;

    const fields = obj.data.content.fields as any;
    return {
      id: obj.data.objectId,
      publicationId: fields.publication_id,
      tier: fields.tier,
      subscribedAt: parseInt(fields.subscribed_at),
      expiresAt: parseInt(fields.expires_at),
      subscriber: fields.subscriber,
    };
  });
}
```

---

## Article Management

### Publish Article (with Encryption)

```typescript
interface PublishArticleParams {
  publicationId: string;
  publisherCapId: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  tier: Tier;
}

async function publishArticle(params: PublishArticleParams) {
  // 1. Encrypt content with Seal
  const sealClient = /* initialize Seal client */;
  const encrypted = await sealClient.encrypt(params.content);

  // 2. Upload to Walrus
  const walrusClient = /* initialize Walrus client */;
  const blobId = await walrusClient.upload(encrypted.data);

  // 3. Create article on-chain
  const txb = new TransactionBlock();

  const [article] = txb.moveCall({
    target: `${PACKAGE_ID}::article::publish_article`,
    arguments: [
      txb.object(params.publicationId),
      txb.object(params.publisherCapId),
      txb.pure.string(params.title),
      txb.pure.string(params.excerpt),
      txb.pure.string(blobId),
      txb.pure.vector('u8', Array.from(encrypted.keyId)),
      txb.pure.u8(params.tier),
      txb.pure.u64(Math.floor(Date.now() / 1000)),
    ],
  });

  const sender = await client.getActiveAddress();
  txb.transferObjects([article], txb.pure.address(sender));

  return executeTransaction(txb);
}
```

### Update Article Metadata

```typescript
async function updateArticle(
  articleId: string,
  publisherCapId: string,
  title: string,
  excerpt: string
) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::article::update_article`,
    arguments: [
      txb.object(articleId),
      txb.object(publisherCapId),
      txb.pure.string(title),
      txb.pure.string(excerpt),
    ],
  });

  return executeTransaction(txb);
}
```

### Archive/Unarchive Article

```typescript
async function archiveArticle(articleId: string, publisherCapId: string) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::article::archive_article`,
    arguments: [txb.object(articleId), txb.object(publisherCapId)],
  });

  return executeTransaction(txb);
}

async function unarchiveArticle(articleId: string, publisherCapId: string) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::article::unarchive_article`,
    arguments: [txb.object(articleId), txb.object(publisherCapId)],
  });

  return executeTransaction(txb);
}
```

### Query Articles for Publication

```typescript
async function getPublicationArticles(publicationId: string) {
  // Note: This requires indexing or pagination for large sets
  // Here's a basic approach using events

  const events = await client.queryEvents({
    query: {
      MoveEventType: `${PACKAGE_ID}::article::ArticlePublished`,
    },
  });

  const articles = events.data
    .filter((event: any) => event.parsedJson.publication_id === publicationId)
    .map((event: any) => ({
      articleId: event.parsedJson.article_id,
      title: event.parsedJson.title,
      tier: event.parsedJson.tier,
    }));

  return articles;
}
```

---

## Access Control

### Verify Subscription Access

```typescript
async function verifyAccess(
  subscriptionId: string,
  articleId: string
): Promise<boolean> {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::access_control::verify_subscription_access`,
    arguments: [txb.object(subscriptionId), txb.object(articleId), txb.object(CLOCK_ID)],
  });

  const simulation = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: await client.getActiveAddress(),
  });

  // Parse boolean result
  return simulation.results?.[0]?.returnValues?.[0]?.[0] === 1;
}
```

### Generate Read Token (Pay-Per-Article)

```typescript
async function generateReadToken(
  articleId: string,
  publicationId: string,
  paymentAmount: bigint
) {
  const txb = new TransactionBlock();

  const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(paymentAmount)]);

  const [token] = txb.moveCall({
    target: `${PACKAGE_ID}::access_control::generate_read_token`,
    arguments: [
      txb.object(articleId),
      txb.object(publicationId),
      coin,
      txb.object(CLOCK_ID),
    ],
  });

  const sender = await client.getActiveAddress();
  txb.transferObjects([token], txb.pure.address(sender));

  return executeTransaction(txb);
}

// Usage - Pay ~0.167 SUI for daily access
const basicPrice = 5_000_000_000n;
const dailyRate = basicPrice / 30n;
await generateReadToken(articleId, publicationId, dailyRate);
```

### Read Article with Access Control

```typescript
async function readArticle(
  articleId: string,
  subscriptionId?: string,
  readTokenId?: string
) {
  // 1. Get article metadata
  const article = await client.getObject({
    id: articleId,
    options: { showContent: true },
  });

  const fields = article.data?.content?.fields as any;

  // 2. Verify access
  let hasAccess = false;

  if (subscriptionId) {
    hasAccess = await verifyAccess(subscriptionId, articleId);
  } else if (readTokenId) {
    // Verify read token (similar flow)
    hasAccess = true; // Simplified
  }

  if (!hasAccess) {
    throw new Error('Access denied');
  }

  // 3. Request decryption key from Seal server
  const sealClient = /* initialize */;
  const key = await sealClient.requestKey({
    keyId: fields.seal_key_id,
    proof: subscriptionId || readTokenId,
  });

  // 4. Fetch encrypted content from Walrus
  const walrusClient = /* initialize */;
  const encryptedBlob = await walrusClient.fetch(fields.walrus_blob_id);

  // 5. Decrypt and return
  const content = await sealClient.decrypt(encryptedBlob, key);

  // 6. Record view (optional)
  if (statsId) {
    recordArticleView(statsId, articleId);
  }

  return {
    title: fields.title,
    content,
    publishedAt: parseInt(fields.published_at),
  };
}
```

---

## Analytics

### Query Creator Stats

```typescript
async function getPublicationStats(statsId: string, publisherCapId: string) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::analytics::get_stats`,
    arguments: [txb.object(statsId), txb.object(publisherCapId)],
  });

  const simulation = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: await client.getActiveAddress(),
  });

  // Parse return values
  // Returns: (SubscriberCounts, total_revenue, article_views)
  return {
    subscribers: parseSubscriberCounts(simulation.results[0].returnValues[0]),
    revenue: parseU64(simulation.results[0].returnValues[1]),
    views: parseViewMap(simulation.results[0].returnValues[2]),
  };
}
```

---

## Treasury Operations

The treasury module manages protocol fees and deposits. All treasury operations are integrated into the subscription and article publishing flows.

### Initialize Treasury (Deployment Only)

```typescript
// Treasury is automatically created during module deployment
// The init() function creates:
// - Treasury (shared object)
// - TreasuryCap (owned by deployer)

// After deployment, save these IDs
const TREASURY_ID = '0x...'; // From deployment output
const TREASURY_CAP_ID = '0x...'; // From deployment output
```

### Subscribe with Treasury Fee

```typescript
interface SubscribeWithFeeParams {
  publicationId: string;
  treasuryId: string;
  tier: Tier;
  paymentAmount: bigint;
}

async function subscribeWithTreasuryFee(params: SubscribeWithFeeParams) {
  const txb = new TransactionBlock();

  // Split coins for payment
  let [paymentCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(params.paymentAmount)]);

  // Collect treasury fee (1% default)
  // Returns remaining amount after fee deduction
  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::collect_subscription_fee`,
    arguments: [
      txb.object(params.treasuryId),
      paymentCoin,
      txb.pure.id(params.publicationId),
      txb.pure.address(await client.getActiveAddress()),
    ],
  });

  // Subscribe with remaining payment (after fee)
  const [subscription] = txb.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe`,
    arguments: [
      txb.object(params.publicationId),
      txb.pure.u8(params.tier),
      paymentCoin, // Now contains (payment - fee)
      txb.object(CLOCK_ID),
    ],
  });

  // Transfer subscription to user
  const sender = await client.getActiveAddress();
  txb.transferObjects([subscription], txb.pure.address(sender));

  return executeTransaction(txb);
}

// Usage
await subscribeWithTreasuryFee({
  publicationId: '0x...',
  treasuryId: TREASURY_ID,
  tier: Tier.Basic,
  paymentAmount: 5_000_000_000n, // 5 SUI
  // Treasury takes 50,000,000 MIST (0.05 SUI)
  // Creator receives 4,950,000,000 MIST (4.95 SUI)
});
```

### Publish Article with Deposit

```typescript
interface PublishWithDepositParams {
  publicationId: string;
  publisherCapId: string;
  treasuryId: string;
  premiumPrice: bigint;
  title: string;
  excerpt: string;
  walrusBlobId: string;
  sealKeyId: Uint8Array;
  tier: Tier;
}

async function publishArticleWithDeposit(params: PublishWithDepositParams) {
  const txb = new TransactionBlock();

  // Calculate required deposit (1% of premium price by default)
  const depositAmount = params.premiumPrice / 100n;

  // Split coins for deposit
  const [depositCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(depositAmount)]);

  // Collect article deposit
  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::collect_article_deposit`,
    arguments: [
      txb.object(params.treasuryId),
      depositCoin,
      txb.pure.id(params.publicationId),
      txb.pure.address(await client.getActiveAddress()),
    ],
  });

  // Publish article
  const [article] = txb.moveCall({
    target: `${PACKAGE_ID}::article::publish_article`,
    arguments: [
      txb.object(params.publicationId),
      txb.object(params.publisherCapId),
      txb.pure.string(params.title),
      txb.pure.string(params.excerpt),
      txb.pure.string(params.walrusBlobId),
      txb.pure.vector('u8', Array.from(params.sealKeyId)),
      txb.pure.u8(params.tier),
      txb.pure.u64(Math.floor(Date.now() / 1000)),
    ],
  });

  const sender = await client.getActiveAddress();
  txb.transferObjects([article], txb.pure.address(sender));

  return executeTransaction(txb);
}

// Usage
await publishArticleWithDeposit({
  publicationId: '0x...',
  publisherCapId: '0x...',
  treasuryId: TREASURY_ID,
  premiumPrice: 15_000_000_000n, // 15 SUI premium
  title: 'My Article',
  excerpt: 'Preview text...',
  walrusBlobId: 'walrus_blob_...',
  sealKeyId: new Uint8Array([...]),
  tier: Tier.Premium,
  // Requires deposit of 150,000,000 MIST (0.15 SUI)
});
```

### Pay-Per-Article with Treasury Fee

```typescript
async function payPerArticleWithFee(
  articleId: string,
  publicationId: string,
  treasuryId: string,
  paymentAmount: bigint
) {
  const txb = new TransactionBlock();

  let [paymentCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(paymentAmount)]);

  // Collect pay-per-article fee
  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::collect_pay_per_article_fee`,
    arguments: [
      txb.object(treasuryId),
      paymentCoin,
      txb.pure.id(articleId),
      txb.pure.address(await client.getActiveAddress()),
    ],
  });

  // Generate read token with remaining payment
  const [token] = txb.moveCall({
    target: `${PACKAGE_ID}::access_control::generate_read_token`,
    arguments: [
      txb.object(articleId),
      txb.object(publicationId),
      paymentCoin, // Contains (payment - fee)
      txb.object(CLOCK_ID),
    ],
  });

  const sender = await client.getActiveAddress();
  txb.transferObjects([token], txb.pure.address(sender));

  return executeTransaction(txb);
}
```

### Query Treasury Balance

```typescript
async function getTreasuryBalance(treasuryId: string): Promise<bigint> {
  const object = await client.getObject({
    id: treasuryId,
    options: { showContent: true },
  });

  if (object.data?.content?.dataType !== 'moveObject') {
    throw new Error('Invalid treasury object');
  }

  const fields = object.data.content.fields as any;
  return BigInt(fields.balance);
}

async function getTreasuryStats(treasuryId: string) {
  const object = await client.getObject({
    id: treasuryId,
    options: { showContent: true },
  });

  if (object.data?.content?.dataType !== 'moveObject') {
    throw new Error('Invalid treasury object');
  }

  const fields = object.data.content.fields as any;

  return {
    balance: BigInt(fields.balance),
    subscriptionFeeBps: parseInt(fields.subscription_fee_bps),
    articleDepositBps: parseInt(fields.article_deposit_bps),
    totalFeesCollected: BigInt(fields.total_fees_collected),
    totalDepositsCollected: BigInt(fields.total_deposits_collected),
  };
}
```

### Calculate Fees (View Function)

```typescript
async function calculateArticleDeposit(
  treasuryId: string,
  premiumPrice: bigint
): Promise<bigint> {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::calculate_article_deposit`,
    arguments: [txb.object(treasuryId), txb.pure.u64(premiumPrice)],
  });

  const simulation = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: await client.getActiveAddress(),
  });

  // Parse u64 result
  const resultData = simulation.results?.[0]?.returnValues?.[0];
  if (!resultData) throw new Error('Failed to calculate deposit');

  return BigInt(resultData[0]);
}

// Usage
const premiumPrice = 15_000_000_000n; // 15 SUI
const depositRequired = await calculateArticleDeposit(TREASURY_ID, premiumPrice);
console.log(`Deposit required: ${depositRequired} MIST`); // 150,000,000 MIST (0.15 SUI)
```

### Admin Operations (Treasury Cap Required)

```typescript
// Withdraw funds from treasury (admin only)
async function withdrawFromTreasury(
  treasuryId: string,
  treasuryCapId: string,
  amount: bigint,
  recipient: string
) {
  const txb = new TransactionBlock();

  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::withdraw`,
    arguments: [
      txb.object(treasuryId),
      txb.object(treasuryCapId),
      txb.pure.u64(amount),
      txb.pure.address(recipient),
    ],
  });

  return executeTransaction(txb);
}

// Update fee rates (admin only)
async function updateFeeRates(
  treasuryId: string,
  treasuryCapId: string,
  newSubscriptionFeeBps: number,
  newArticleDepositBps: number
) {
  const txb = new TransactionBlock();

  // Validate: max 10% (1000 BPS)
  if (newSubscriptionFeeBps > 1000 || newArticleDepositBps > 1000) {
    throw new Error('Fee rates cannot exceed 10% (1000 BPS)');
  }

  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::update_fee_rates`,
    arguments: [
      txb.object(treasuryId),
      txb.object(treasuryCapId),
      txb.pure.u64(newSubscriptionFeeBps),
      txb.pure.u64(newArticleDepositBps),
    ],
  });

  return executeTransaction(txb);
}

// Usage - Update fees to 2% (200 BPS)
await updateFeeRates(TREASURY_ID, TREASURY_CAP_ID, 200, 200);
```

### Fee Calculation Helper

```typescript
/**
 * Calculate fee amount based on basis points
 * @param amount - Amount in MIST
 * @param feeBps - Fee in basis points (100 = 1%)
 * @returns Fee amount in MIST
 */
function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / 10000n;
}

// Examples
const subscriptionFee = calculateFee(5_000_000_000n, 100); // 50,000,000 MIST (0.05 SUI)
const articleDeposit = calculateFee(15_000_000_000n, 100); // 150,000,000 MIST (0.15 SUI)

// Display to user
function formatSUI(mist: bigint): string {
  return (Number(mist) / 1_000_000_000).toFixed(2) + ' SUI';
}

console.log(`Fee: ${formatSUI(subscriptionFee)}`); // "Fee: 0.05 SUI"
```

### Complete Subscription Flow with Treasury

```typescript
async function completeSubscriptionFlow(
  publicationId: string,
  treasuryId: string,
  statsId: string,
  tier: Tier,
  tierPrice: bigint
) {
  const txb = new TransactionBlock();
  const sender = await client.getActiveAddress();

  // 1. Split payment
  let [paymentCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(tierPrice)]);

  // 2. Collect treasury fee (modifies paymentCoin to remainder)
  txb.moveCall({
    target: `${PACKAGE_ID}::treasury::collect_subscription_fee`,
    arguments: [
      txb.object(treasuryId),
      paymentCoin,
      txb.pure.id(publicationId),
      txb.pure.address(sender),
    ],
  });

  // 3. Subscribe with remaining payment
  const [subscription] = txb.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe`,
    arguments: [
      txb.object(publicationId),
      txb.pure.u8(tier),
      paymentCoin, // Now contains (payment - treasury_fee)
      txb.object(CLOCK_ID),
    ],
  });

  // 4. Record analytics
  txb.moveCall({
    target: `${PACKAGE_ID}::analytics::record_subscription`,
    arguments: [txb.object(statsId), txb.pure.u8(tier)],
  });

  // 5. Record revenue (if not free tier)
  if (tier !== Tier.Free) {
    const creatorRevenue = tierPrice - calculateFee(tierPrice, 100); // Subtract 1% fee

    txb.moveCall({
      target: `${PACKAGE_ID}::analytics::record_revenue`,
      arguments: [txb.object(statsId), txb.pure.u64(creatorRevenue)],
    });
  }

  // 6. Transfer subscription to user
  txb.transferObjects([subscription], txb.pure.address(sender));

  return executeTransaction(txb);
}
```

---

## Advanced Patterns

### Batching Multiple Operations

```typescript
async function createPublicationWithContent(
  name: string,
  description: string,
  articles: Array<{ title: string; content: string; tier: Tier }>
) {
  const txb = new TransactionBlock();

  // 1. Create publication
  const [publication, publisherCap] = txb.moveCall({
    target: `${PACKAGE_ID}::publication::create_publication`,
    arguments: [
      txb.pure.string(name),
      txb.pure.string(description),
      txb.pure.u64(5_000_000_000n),
      txb.pure.u64(15_000_000_000n),
      txb.pure.bool(true),
    ],
  });

  // 2. Create stats
  const [stats] = txb.moveCall({
    target: `${PACKAGE_ID}::analytics::create_stats`,
    arguments: [publication, publisherCap],
  });

  // 3. Publish articles (after encrypting and uploading)
  for (const article of articles) {
    // Note: Encryption and Walrus upload must happen before transaction
    const [articleObj] = txb.moveCall({
      target: `${PACKAGE_ID}::article::publish_article`,
      arguments: [
        publication,
        publisherCap,
        txb.pure.string(article.title),
        txb.pure.string(''),
        txb.pure.string('blob_id'),
        txb.pure.vector('u8', []),
        txb.pure.u8(article.tier),
        txb.pure.u64(Date.now() / 1000),
      ],
    });

    txb.transferObjects([articleObj], txb.pure.address(sender));
  }

  // 4. Transfer objects
  const sender = await client.getActiveAddress();
  txb.transferObjects([publication, publisherCap, stats], txb.pure.address(sender));

  return executeTransaction(txb);
}
```

### Event Listening

```typescript
// Listen for new subscriptions
client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionCreated`,
  },
  onMessage: (event) => {
    console.log('New subscription:', {
      publicationId: event.parsedJson.publication_id,
      subscriber: event.parsedJson.subscriber,
      tier: event.parsedJson.tier,
    });
  },
});
```

---

## Error Handling

```typescript
async function safeExecute(txb: TransactionBlock) {
  try {
    const result = await signAndExecute({ transaction: txb });

    // Check effects
    if (result.effects?.status?.status !== 'success') {
      throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
    }

    return result;
  } catch (error: any) {
    // Parse Move errors
    if (error.message?.includes('EInsufficientPayment')) {
      throw new Error('Insufficient payment amount');
    }

    if (error.message?.includes('EInvalidPublicationId')) {
      throw new Error('Invalid publication or permission denied');
    }

    throw error;
  }
}
```

---

## See Also

- [Module API](./MODULE_API.md) - Complete function reference
- [Data Structures](./DATA_STRUCTURES.md) - Struct documentation
- [Events](./EVENTS.md) - Event schemas
- [Security](./SECURITY.md) - Security best practices
