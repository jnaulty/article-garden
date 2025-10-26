# API and Smart Contract Documentation

## Table of Contents

1. [Smart Contract API Reference](#smart-contract-api-reference)
2. [GraphQL API Reference](#graphql-api-reference)
3. [Frontend Hooks API](#frontend-hooks-api)
4. [External Service APIs](#external-service-apis)

---

## Smart Contract API Reference

### Package Information

- **Package ID (Testnet)**: `0x41f5e97994f1f15479821e68e8018b2c52b32a07aea2df59a9db1141690fd88f`
- **Treasury ID (Testnet)**: `0xc97daeff8a72b4f0bed8f66c3c19779d78d6eedbfe3e58774a1495701f863a22`
- **Network**: Sui Testnet
- **Language**: Move
- **Modules**: 8 core modules (publication, article, subscription, access_control, seal_policy, analytics, treasury, marketplace_policies)

### Module: `publication`

#### Structs

```move
struct Publication has key, store {
    id: UID,
    name: String,
    description: String,
    image_url: String,
    publisher: address,
    created_at: u64,
    updated_at: u64,
    article_count: u64,
    subscriber_count: u64,
    basic_price: u64,
    premium_price: u64,
}

struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
    publisher: address,
}
```

#### Public Functions

##### `create_publication`
Creates a new publication and issues a publisher capability.

```move
public entry fun create_publication(
    name: String,
    description: String,
    image_url: String,
    basic_price: u64,
    premium_price: u64,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `name`: Publication name (max 100 chars)
- `description`: Publication description (max 500 chars)
- `image_url`: URL to publication image
- `basic_price`: Price for basic tier subscription (in MIST)
- `premium_price`: Price for premium tier subscription (in MIST)
- `clock`: Sui system clock for timestamps
- `ctx`: Transaction context

**Returns:**
- Creates `Publication` object (shared)
- Issues `PublisherCap` to sender

**Events:**
- `PublicationCreated`

##### `update_publication_metadata`
Updates publication details.

```move
public entry fun update_publication_metadata(
    publication: &mut Publication,
    _cap: &PublisherCap,
    name: String,
    description: String,
    image_url: String,
    clock: &Clock,
    _ctx: &mut TxContext
)
```

**Authorization:** Requires `PublisherCap`

##### `update_tier_pricing`
Updates subscription tier prices.

```move
public entry fun update_tier_pricing(
    publication: &mut Publication,
    _cap: &PublisherCap,
    basic_price: u64,
    premium_price: u64,
    _ctx: &mut TxContext
)
```

---

### Module: `article`

#### Structs

```move
struct Article has key, store {
    id: UID,
    publication_id: ID,
    title: String,
    excerpt: String,
    content_url: String,
    tier: String,
    author: address,
    created_at: u64,
    updated_at: u64,
    is_archived: bool,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
}
```

#### Public Functions

##### `create_article`
Publishes a new article to a publication.

```move
public entry fun create_article(
    publication: &mut Publication,
    _cap: &PublisherCap,
    title: String,
    excerpt: String,
    content_url: String,
    tier: String,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `publication`: Target publication
- `_cap`: Publisher capability
- `title`: Article title
- `excerpt`: Article preview text
- `content_url`: URL to encrypted content
- `tier`: Access tier (FREE, BASIC, PREMIUM)
- `walrus_blob_id`: Walrus storage blob ID
- `seal_key_id`: Seal encryption ID
- `clock`: System clock
- `ctx`: Transaction context

**Events:**
- `ArticleCreated`

##### `update_article`
Updates an existing article.

```move
public entry fun update_article(
    article: &mut Article,
    _cap: &PublisherCap,
    title: String,
    excerpt: String,
    content_url: String,
    tier: String,
    clock: &Clock,
    _ctx: &mut TxContext
)
```

##### `archive_article`
Soft deletes an article.

```move
public entry fun archive_article(
    article: &mut Article,
    _cap: &PublisherCap,
    _ctx: &mut TxContext
)
```

---

### Module: `subscription`

#### Structs

```move
struct SubscriptionNFT has key, store {
    id: UID,
    publication_id: ID,
    subscriber: address,
    tier: String,
    expires_at: u64,
    created_at: u64,
}
```

#### Public Functions

##### `purchase_subscription`
Purchases a subscription to a publication.

```move
public entry fun purchase_subscription(
    publication: &mut Publication,
    tier: String,
    duration_days: u64,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `publication`: Target publication
- `tier`: Subscription tier (FREE, BASIC, PREMIUM)
- `duration_days`: Subscription duration
- `payment`: Payment in SUI
- `clock`: System clock
- `ctx`: Transaction context

**Returns:**
- Mints `SubscriptionNFT` to sender

**Events:**
- `SubscriptionPurchased`

##### `upgrade_subscription`
Upgrades an existing subscription to a higher tier.

```move
public entry fun upgrade_subscription(
    subscription: &mut SubscriptionNFT,
    publication: &Publication,
    new_tier: String,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

##### `renew_subscription`
Extends an existing subscription.

```move
public entry fun renew_subscription(
    subscription: &mut SubscriptionNFT,
    publication: &Publication,
    duration_days: u64,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

---

### Module: `access_control`

#### Structs

```move
struct ReadToken has key, store {
    id: UID,
    article_id: ID,
    owner: address,
    expires_at: u64,
}
```

#### Public Functions

##### `verify_subscription_access`
Checks if a subscription grants access to an article.

```move
public fun verify_subscription_access(
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock
): bool
```

**Returns:** `true` if access is granted

##### `verify_read_token`
Checks if a read token grants access to an article.

```move
public fun verify_read_token(
    token: &ReadToken,
    article: &Article,
    clock: &Clock
): bool
```

##### `create_read_token`
Issues a single-article access token.

```move
public entry fun create_read_token(
    article: &Article,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

---

### Module: `seal_policy`

#### Entry Functions

##### `seal_approve_subscription`
Verifies subscription-based access for Seal decryption.

```move
entry fun seal_approve_subscription(
    id: vector<u8>,
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock
)
```

**Called by:** Seal key servers
**Aborts if:** Access denied

##### `seal_approve_read_token`
Verifies token-based access for Seal decryption.

```move
entry fun seal_approve_read_token(
    id: vector<u8>,
    token: &ReadToken,
    article: &Article,
    clock: &Clock
)
```

---

### Module: `analytics`

#### Structs

```move
struct ArticleStats has key, store {
    id: UID,
    article_id: ID,
    view_count: u64,
    read_count: u64,
    unique_readers: VecSet<address>,
}
```

#### Public Functions

##### `record_view`
Records an article view.

```move
public entry fun record_view(
    stats: &mut ArticleStats,
    _ctx: &mut TxContext
)
```

##### `record_read`
Records a complete article read.

```move
public entry fun record_read(
    stats: &mut ArticleStats,
    ctx: &mut TxContext
)
```

---

### Module: `treasury`

Manages protocol treasury for collecting fees and deposits. See [TREASURY.md](./TREASURY.md) for complete documentation.

#### Structs

```move
public struct Treasury has key {
    id: UID,
    balance: Balance<SUI>,
    subscription_fee_bps: u64,      // Fee rate for subscriptions (default: 100 = 1%)
    article_deposit_bps: u64,       // Deposit rate for articles (default: 100 = 1%)
    total_fees_collected: u64,      // Total subscription/pay-per-article fees
    total_deposits_collected: u64,  // Total article deposits
}

public struct TreasuryCap has key, store {
    id: UID,
}
```

#### Public Functions

##### `collect_subscription_fee`
Collects 1% fee from subscription payment.

```move
public fun collect_subscription_fee(
    treasury: &mut Treasury,
    payment: &mut Coin<SUI>,
    publication_id: ID,
    subscriber: address,
    ctx: &mut TxContext
): u64
```

**Parameters:**
- `treasury`: Mutable reference to shared Treasury object
- `payment`: Payment coin (fee is deducted in-place)
- `publication_id`: ID of publication being subscribed to
- `subscriber`: Address of subscriber
- `ctx`: Transaction context

**Returns:** Amount remaining after fee (for publisher)

**Events:** `SubscriptionFeeCollected`

**Example:**
```move
// User pays 1000 SUI for subscription
let publisher_amount = treasury::collect_subscription_fee(
    &mut treasury,
    &mut payment_coin,
    publication_id,
    user_address,
    ctx
);
// publisher_amount = 990 SUI (99%)
// treasury gets 10 SUI (1%)
```

##### `collect_article_deposit`
Collects article publishing deposit (non-refundable).

```move
public fun collect_article_deposit(
    treasury: &mut Treasury,
    deposit: Coin<SUI>,
    publication_id: ID,
    publisher: address,
)
```

**Parameters:**
- `treasury`: Mutable reference to shared Treasury object
- `deposit`: Deposit coin (consumed entirely)
- `publication_id`: ID of publication
- `publisher`: Address of publisher

**Events:** `ArticleDepositCollected`

**Note:** Deposit amount is 1% of publication's premium tier price.

##### `calculate_article_deposit`
Calculates required deposit for publishing an article.

```move
public fun calculate_article_deposit(
    treasury: &Treasury,
    premium_price: u64
): u64
```

**Parameters:**
- `treasury`: Reference to Treasury object
- `premium_price`: Premium tier monthly subscription price

**Returns:** Required deposit amount

**Formula:** `deposit = (premium_price * article_deposit_bps) / 10000`

**Examples:**
- Premium price: 500 SUI → Deposit: 5 SUI (1%)
- Premium price: 1000 SUI → Deposit: 10 SUI (1%)
- Premium price: 0 SUI (free pub) → Deposit: 0 SUI

##### `withdraw` (Admin Only)
Withdraws funds from treasury.

```move
public fun withdraw(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
)
```

**Authorization:** Requires `TreasuryCap`

**Events:** `TreasuryWithdrawal`

##### `update_fee_rates` (Admin Only)
Updates protocol fee rates.

```move
public fun update_fee_rates(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
)
```

**Parameters:**
- `new_subscription_fee_bps`: New subscription fee (0-1000 BPS = 0-10%)
- `new_article_deposit_bps`: New article deposit rate (0-1000 BPS = 0-10%)

**Authorization:** Requires `TreasuryCap`

**Events:** `FeeRatesUpdated`

#### Query Functions

```move
public fun balance(treasury: &Treasury): u64
public fun subscription_fee_bps(treasury: &Treasury): u64
public fun article_deposit_bps(treasury: &Treasury): u64
public fun total_fees_collected(treasury: &Treasury): u64
public fun total_deposits_collected(treasury: &Treasury): u64
```

#### Events

```move
public struct SubscriptionFeeCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    subscriber: address,
}

public struct ArticleDepositCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    publisher: address,
}

public struct TreasuryWithdrawal has copy, drop {
    amount: u64,
    recipient: address,
}

public struct FeeRatesUpdated has copy, drop {
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
}
```

#### Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `EInsufficientBalance` | Treasury balance insufficient for withdrawal |
| 2 | `EInvalidFeeRate` | Fee rate exceeds maximum (10%) |
| 3 | `EZeroAmount` | Attempted deposit with zero amount |

---

### Module: `marketplace_policies`

Manages subscription NFT trading policies with royalty enforcement. See [KIOSK_INTEGRATION.md](./KIOSK_INTEGRATION.md) for complete documentation.

#### Structs

```move
public struct Rule has drop {}

public struct Config has store, drop {
    amount_bp: u16,      // Royalty percentage in basis points (1000 = 10%)
    min_amount: u64,     // Minimum royalty amount in MIST
}
```

#### Public Functions

##### `add_royalty_rule` (Publisher Only)
Adds royalty enforcement to transfer policy.

```move
public fun add_royalty_rule(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount_bp: u16,     // Royalty in basis points (default: 1000 = 10%)
    min_amount: u64     // Minimum royalty in MIST
)
```

**Parameters:**
- `policy`: Mutable transfer policy for SubscriptionNFT
- `cap`: Transfer policy capability (proves ownership)
- `amount_bp`: Royalty percentage (0-10000 = 0-100%, default 1000 = 10%)
- `min_amount`: Minimum absolute royalty (useful for low-price sales)

**Authorization:** Requires `TransferPolicyCap`

**Example:**
```move
// 10% royalty, minimum 1 SUI
marketplace_policies::add_royalty_rule(
    &mut policy,
    &policy_cap,
    1000,              // 10%
    1_000_000_000      // 1 SUI minimum
);
```

##### `pay_royalty` (Buyer Action)
Pays royalty during subscription purchase.

```move
public fun pay_royalty(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    request: &mut TransferRequest<SubscriptionNFT>,
    payment: Coin<SUI>
)
```

**Parameters:**
- `policy`: Transfer policy for validation
- `request`: Transfer request from Kiosk purchase
- `payment`: Coin with exact royalty amount

**Usage:** Called during Kiosk purchase flow after `kiosk::purchase()` and before `transfer_policy::confirm_request()`.

**Errors:**
- `EInsufficientPayment`: Payment doesn't match calculated royalty

##### `calculate_royalty_amount`
Calculates royalty owed on a sale.

```move
public fun calculate_royalty_amount(
    policy: &TransferPolicy<SubscriptionNFT>,
    sale_price: u64
): u64
```

**Parameters:**
- `policy`: Transfer policy containing royalty config
- `sale_price`: Price of subscription sale

**Returns:** Royalty amount (max of percentage-based or minimum)

**Formula:** `max(sale_price * royalty_bp / 10000, min_amount)`

**Examples:**
```
Sale: 300 SUI, Royalty: 10%, Min: 1 SUI
→ max(30 SUI, 1 SUI) = 30 SUI

Sale: 5 SUI, Royalty: 10%, Min: 1 SUI
→ max(0.5 SUI, 1 SUI) = 1 SUI (minimum enforced)
```

##### `withdraw_royalties` (Publisher Only)
Withdraws accumulated royalty earnings.

```move
public fun withdraw_royalties(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount: Option<u64>,  // None = withdraw all
    ctx: &mut TxContext
): Coin<SUI>
```

**Parameters:**
- `policy`: Transfer policy holding royalties
- `cap`: Transfer policy capability
- `amount`: Optional specific amount (None withdraws all)
- `ctx`: Transaction context

**Returns:** Coin with withdrawn royalties

**Authorization:** Requires `TransferPolicyCap`

##### `remove_royalty_rule` (Publisher Only)
Removes royalty rule from policy.

```move
public fun remove_royalty_rule(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>
)
```

**Authorization:** Requires `TransferPolicyCap`

#### Query Functions

```move
public fun royalty_bp(policy: &TransferPolicy<SubscriptionNFT>): u16
public fun min_royalty_amount(policy: &TransferPolicy<SubscriptionNFT>): u64
public fun default_royalty_bps(): u16  // Returns 1000 (10%)
```

#### Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `EInsufficientPayment` | Royalty payment doesn't match required amount |
| 2 | `ERoyaltyTooHigh` | Royalty exceeds maximum (100%) |

#### Integration with Kiosk

**Complete Purchase Flow:**
```typescript
// 1. Purchase from Kiosk
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [kioskId, subscriptionId, paymentCoin],
  typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
});

// 2. Calculate royalty
const royalty = await calculateRoyaltyAmount(policy, salePrice);

// 3. Pay royalty
tx.moveCall({
  target: `${packageId}::marketplace_policies::pay_royalty`,
  arguments: [policyId, transferRequest, royaltyCoin]
});

// 4. Confirm transfer
tx.moveCall({
  target: '0x2::transfer_policy::confirm_request',
  arguments: [policyId, transferRequest],
  typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
});

// 5. Receive NFT
tx.transferObjects([nft], buyerAddress);
```

---

## GraphQL API Reference

### Endpoint

```
https://sui-[network].mystenlabs.com/graphql
```

### Queries

#### Get Publications

```graphql
query GetPublications($first: Int, $after: String) {
  publications(first: $first, after: $after) {
    nodes {
      id
      name
      description
      imageUrl
      publisher
      articleCount
      subscriberCount
      basicPrice
      premiumPrice
      createdAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Get Publication Details

```graphql
query GetPublication($id: ID!) {
  publication(id: $id) {
    id
    name
    description
    imageUrl
    publisher
    articles {
      nodes {
        id
        title
        excerpt
        tier
        author
        createdAt
        isArchived
      }
    }
    stats {
      totalViews
      totalReads
      subscriberCount
    }
  }
}
```

#### Get User Subscriptions

```graphql
query GetUserSubscriptions($address: String!) {
  address(address: $address) {
    subscriptions {
      nodes {
        id
        publicationId
        tier
        expiresAt
        createdAt
        publication {
          name
          imageUrl
        }
      }
    }
  }
}
```

#### Get Article with Access Check

```graphql
query GetArticle($id: ID!, $userAddress: String) {
  article(id: $id) {
    id
    title
    excerpt
    tier
    contentUrl
    walrusBlobId
    sealKeyId
    hasAccess(userAddress: $userAddress)
  }
}
```

### Subscriptions (WebSocket)

#### Watch Subscription Status

```graphql
subscription WatchSubscription($subscriptionId: ID!) {
  subscriptionUpdated(id: $subscriptionId) {
    tier
    expiresAt
    isActive
  }
}
```

---

## Frontend Hooks API

### usePublication

#### `useCreatePublication`
Creates a new publication.

```typescript
const { createPublication, isLoading, error } = useCreatePublication();

await createPublication({
  name: string,
  description: string,
  imageUrl: string,
  basicPrice: number,
  premiumPrice: number
});
```

#### `useUpdatePublication`
Updates publication metadata.

```typescript
const { updatePublication } = useUpdatePublication();

await updatePublication({
  publicationId: string,
  name: string,
  description: string,
  imageUrl: string
});
```

#### `usePublicationQuery`
Fetches publication details.

```typescript
const { data, isLoading, error } = usePublicationQuery(publicationId);

// Returns:
interface Publication {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  publisher: string;
  articleCount: number;
  subscriberCount: number;
  basicPrice: string;
  premiumPrice: string;
}
```

### useArticle

#### `usePublishArticle`
Publishes a new article.

```typescript
const { publishArticle } = usePublishArticle();

await publishArticle({
  publicationId: string,
  title: string,
  excerpt: string,
  content: string,
  tier: 'FREE' | 'BASIC' | 'PREMIUM'
});
```

#### `useArticleQuery`
Fetches article details.

```typescript
const { data, isLoading } = useArticleQuery(articleId);

// Returns:
interface Article {
  id: string;
  title: string;
  excerpt: string;
  tier: string;
  contentUrl: string;
  author: string;
  createdAt: string;
  hasAccess: boolean;
}
```

### useEncryptedArticle

#### `usePublishEncryptedArticle`
Publishes an article with encryption.

```typescript
const { publishArticle } = usePublishEncryptedArticle();

const result = await publishArticle({
  publicationId: string,
  title: string,
  content: string, // Will be encrypted
  tier: 'FREE' | 'BASIC' | 'PREMIUM',
  excerpt: string
});

// Returns:
interface PublishResult {
  articleId: string;
  walrusBlobId: string;
  sealKeyId: string;
  transactionDigest: string;
}
```

#### `useDecryptArticle`
Decrypts and fetches article content.

```typescript
const { decryptArticle, isDecrypting } = useDecryptArticle();

const content = await decryptArticle({
  articleId: string,
  walrusBlobId: string,
  sealKeyId: string
});
```

### useSubscription

#### `usePurchaseSubscription`
Purchases a subscription.

```typescript
const { purchaseSubscription } = usePurchaseSubscription();

await purchaseSubscription({
  publicationId: string,
  tier: 'FREE' | 'BASIC' | 'PREMIUM',
  durationDays: number,
  payment: number // in MIST
});
```

#### `useUserSubscriptions`
Fetches user's subscriptions.

```typescript
const { data: subscriptions } = useUserSubscriptions(userAddress);

// Returns:
interface Subscription {
  id: string;
  publicationId: string;
  tier: string;
  expiresAt: string;
  isActive: boolean;
}[]
```

#### `useCheckAccess`
Checks if user has access to content.

```typescript
const { hasAccess, isLoading } = useCheckAccess(articleId, userAddress);
```

### useAccessQueries

#### `useVerifyAccess`
Comprehensive access verification.

```typescript
const { verifyAccess } = useVerifyAccess();

const result = await verifyAccess({
  articleId: string,
  userAddress: string
});

// Returns:
interface AccessResult {
  hasAccess: boolean;
  accessType: 'SUBSCRIPTION' | 'READ_TOKEN' | 'NONE';
  expiresAt?: string;
}
```

---

## External Service APIs

### Walrus Storage API

#### Upload Content

```typescript
import { uploadToWalrus } from '@/services/walrus';

const result = await uploadToWalrus(
  content: Uint8Array,
  suiClient: SuiClient,
  ownerAddress: string,
  signAndExecute: SignFunction,
  epochs: number
);

// Returns:
interface WalrusUploadResult {
  blobId: string;
  size: number;
  storageUrl: string;
}
```

#### Download Content

```typescript
import { downloadFromWalrus } from '@/services/walrus';

const content = await downloadFromWalrus(
  blobId: string,
  walrusClient: WalrusClient
);

// Returns: Uint8Array
```

### Seal Encryption API

#### Encrypt Content

```typescript
import { encryptWithSeal } from '@/services/seal';

const result = await encryptWithSeal(
  content: string,
  policy: SealPolicy
);

// Returns:
interface SealEncryptResult {
  encryptedData: Uint8Array;
  sealId: string;
  policy: string;
}
```

#### Decrypt Content

```typescript
import { decryptWithSeal } from '@/services/seal';

const content = await decryptWithSeal(
  encryptedData: Uint8Array,
  sealId: string,
  accessProof: AccessProof
);

// Returns: string (decrypted content)
```

### Policy Definitions

```typescript
interface SealPolicy {
  type: 'SUBSCRIPTION' | 'READ_TOKEN';
  publicationId: string;
  articleId: string;
  tier?: string;
}

interface AccessProof {
  type: 'SUBSCRIPTION' | 'READ_TOKEN';
  objectId: string; // Subscription or token ID
  signature?: string;
}
```

---

## Error Codes

### Smart Contract Errors

| Code | Module | Description |
|------|--------|-------------|
| 0 | publication | Invalid publication name |
| 1 | publication | Invalid description |
| 2 | publication | Unauthorized (missing cap) |
| 0 | article | Invalid tier |
| 1 | article | Article archived |
| 2 | article | Unauthorized |
| 0 | subscription | Invalid tier |
| 1 | subscription | Insufficient payment |
| 2 | subscription | Already subscribed |
| 3 | subscription | Subscription expired |
| 1 | access_control | Access denied |
| 2 | access_control | Token expired |
| 1 | seal_policy | Access denied |

### API Error Responses

```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}
```

Common error codes:
- `NETWORK_ERROR`: Network connection failed
- `WALLET_ERROR`: Wallet operation failed
- `STORAGE_ERROR`: Walrus storage error
- `ENCRYPTION_ERROR`: Seal encryption error
- `ACCESS_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data

---

## Rate Limits

### GraphQL API
- **Requests per minute**: 100
- **Query complexity**: 1000 points
- **Subscription connections**: 10 per IP

### Walrus Storage
- **Upload size**: 100MB per file
- **Downloads per minute**: 50
- **Concurrent uploads**: 5

### Seal Encryption
- **Encryption requests**: 20 per minute
- **Decryption requests**: 50 per minute
- **Key server queries**: 100 per minute

---

## Webhooks and Events

### Blockchain Events

Events emitted by smart contracts can be monitored:

```typescript
// Subscribe to events
const unsubscribe = suiClient.subscribeEvent({
  filter: {
    Package: PACKAGE_ID,
    Module: 'publication',
    EventType: 'PublicationCreated'
  },
  onMessage(event) {
    console.log('New publication:', event);
  }
});
```

### Available Events

| Module | Event | Data |
|--------|-------|------|
| publication | PublicationCreated | `{id, name, publisher}` |
| publication | PublicationUpdated | `{id, fields}` |
| article | ArticleCreated | `{id, publicationId, title}` |
| article | ArticleUpdated | `{id, fields}` |
| subscription | SubscriptionPurchased | `{id, userId, tier}` |
| subscription | SubscriptionUpgraded | `{id, newTier}` |
| subscription | SubscriptionRenewed | `{id, expiresAt}` |
| analytics | ArticleViewed | `{articleId, viewer}` |
| analytics | ArticleRead | `{articleId, reader}` |

---

## SDK Examples

### Complete Publishing Flow

```typescript
// 1. Create publication
const { publicationId } = await createPublication({
  name: "Tech Blog",
  description: "Latest in tech",
  imageUrl: "https://...",
  basicPrice: 5_000_000_000,
  premiumPrice: 10_000_000_000
});

// 2. Publish encrypted article
const { articleId } = await publishEncryptedArticle({
  publicationId,
  title: "Web3 Future",
  content: "Article content...",
  tier: "PREMIUM",
  excerpt: "Preview..."
});

// 3. User purchases subscription
await purchaseSubscription({
  publicationId,
  tier: "PREMIUM",
  durationDays: 30,
  payment: 10_000_000_000
});

// 4. User reads article
const content = await decryptArticle({
  articleId,
  walrusBlobId,
  sealKeyId
});
```

### Access Verification Flow

```typescript
// Check multiple access methods
async function checkArticleAccess(articleId: string, userAddress: string) {
  // 1. Check subscription
  const subscription = await getActiveSubscription(userAddress, publicationId);
  if (subscription && canAccessTier(subscription.tier, article.tier)) {
    return { hasAccess: true, method: 'subscription' };
  }

  // 2. Check read token
  const token = await getReadToken(userAddress, articleId);
  if (token && !isExpired(token)) {
    return { hasAccess: true, method: 'token' };
  }

  // 3. Check if article is free
  if (article.tier === 'FREE') {
    return { hasAccess: true, method: 'free' };
  }

  return { hasAccess: false, method: null };
}
```

---

## Testing

### Test Network Configuration

```typescript
const testConfig = {
  network: 'testnet',
  packageId: '0x...',
  walrusNetwork: 'testnet',
  sealNetwork: 'testnet',
  graphqlEndpoint: 'https://sui-testnet.mystenlabs.com/graphql'
};
```

### Mock Data Generators

```typescript
// Generate test publication
function createTestPublication() {
  return {
    name: `Test Pub ${Date.now()}`,
    description: 'Test description',
    imageUrl: 'https://example.com/image.png',
    basicPrice: 1_000_000_000,
    premiumPrice: 2_000_000_000
  };
}

// Generate test article
function createTestArticle(publicationId: string) {
  return {
    publicationId,
    title: `Test Article ${Date.now()}`,
    content: 'Test content...',
    tier: 'BASIC',
    excerpt: 'Test excerpt...'
  };
}
```

---

## Migration Guide

### From v1 to v2

Breaking changes:
1. `Publication.owner` renamed to `Publication.publisher`
2. `Article.encrypted_content` split into `walrus_blob_id` and `seal_key_id`
3. Subscription tiers now use strings instead of enums

Migration steps:
```typescript
// Old
const pub = { owner: address, encrypted_content: blob };

// New
const pub = { publisher: address, walrus_blob_id: id, seal_key_id: key };
```

---

## Support and Resources

- **Documentation**: [Full docs](./README.md)
- **Examples**: [Code examples](./examples/)
- **Issues**: [GitHub Issues](https://github.com/...)
- **Discord**: [Community Discord](https://discord.gg/...)