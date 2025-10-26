# Module API Reference

Complete API documentation for all public functions in the private publishing platform.

## Table of Contents

- [publication](#publication)
- [article](#article)
- [subscription](#subscription)
- [access_control](#access_control)
- [marketplace_policies](#marketplace_policies)
- [analytics](#analytics)
- [seal_policy](#seal_policy)
- [treasury](#treasury)

---

## publication

**Source:** `sources/publication.move`

Manages publications and publisher capabilities.

### Structs

#### `Publication`
```move
public struct Publication has key, store {
    id: UID,
    name: String,
    description: String,
    creator: address,
    free_tier_enabled: bool,
    basic_price: u64,      // Monthly price in MIST
    premium_price: u64,    // Monthly price in MIST
    article_count: u64,
}
```

#### `PublisherCap`
```move
public struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
}
```

### Functions

#### `create_publication`
```move
public fun create_publication(
    name: String,
    description: String,
    basic_price: u64,
    premium_price: u64,
    free_tier_enabled: bool,
    ctx: &mut TxContext
): (Publication, PublisherCap)
```

Creates a new publication and returns both the publication and capability.

**Parameters:**
- `name` - Publication name (e.g., "Tech Weekly")
- `description` - Publication description
- `basic_price` - Monthly subscription price in MIST (e.g., 5_000_000_000 = 5 SUI)
- `premium_price` - Monthly premium price in MIST (must be >= basic_price)
- `free_tier_enabled` - Whether free tier is available
- `ctx` - Transaction context

**Returns:** `(Publication, PublisherCap)` tuple

**Aborts:**
- `EInvalidPrice` if `premium_price < basic_price`

**Events:**
- Emits `PublicationCreated`

**Example:**
```move
let (publication, publisher_cap) = publication::create_publication(
    b"My Newsletter".to_string(),
    b"Weekly tech updates".to_string(),
    5_000_000_000,  // 5 SUI basic
    15_000_000_000, // 15 SUI premium
    true,           // Free tier enabled
    ctx
);
```

#### `update_pricing`
```move
public fun update_pricing(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,
    basic_price: u64,
    premium_price: u64,
)
```

Updates subscription pricing for a publication.

**Parameters:**
- `publication` - Mutable reference to publication
- `publisher_cap` - Ownership proof (must match publication)
- `basic_price` - New basic price in MIST
- `premium_price` - New premium price in MIST

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match publication
- `EInvalidPrice` if premium_price < basic_price

**Events:**
- Emits `PricingUpdated`

#### `toggle_free_tier`
```move
public fun toggle_free_tier(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,
    enabled: bool,
)
```

Enables or disables free tier subscriptions.

**Parameters:**
- `publication` - Mutable reference to publication
- `publisher_cap` - Ownership proof
- `enabled` - True to enable, false to disable

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match publication

**Events:**
- Emits `FreeTierToggled`

#### `increment_article_count` (package-only)
```move
public(package) fun increment_article_count(publication: &mut Publication)
```

Increments article counter. Only callable by article module.

### Accessor Functions

```move
public fun id(publication: &Publication): ID
public fun name(publication: &Publication): String
public fun description(publication: &Publication): String
public fun creator(publication: &Publication): address
public fun free_tier_enabled(publication: &Publication): bool
public fun basic_price(publication: &Publication): u64
public fun premium_price(publication: &Publication): u64
public fun article_count(publication: &Publication): u64
public fun publisher_cap_publication_id(cap: &PublisherCap): ID
```

---

## article

**Source:** `sources/article.move`

Manages encrypted articles with Walrus blob storage and Seal encryption.

### Structs

#### `Article`
```move
public struct Article has key, store {
    id: UID,
    publication_id: ID,
    title: String,
    excerpt: String,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    tier: Tier,
    published_at: u64,
    is_archived: bool,
}
```

### Functions

#### `publish_article`
```move
public fun publish_article(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,
    title: String,
    excerpt: String,
    walrus_blob_id: String,
    seal_key_id: vector<u8>,
    tier: Tier,
    published_at: u64,
    ctx: &mut TxContext
): Article
```

Publishes a new encrypted article.

**Parameters:**
- `publication` - Target publication
- `publisher_cap` - Ownership proof
- `title` - Article title
- `excerpt` - Public preview text
- `walrus_blob_id` - Encrypted content location on Walrus
- `seal_key_id` - Seal encryption key reference
- `tier` - Required subscription tier (Free/Basic/Premium)
- `published_at` - Unix timestamp in seconds
- `ctx` - Transaction context

**Returns:** `Article` object

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match publication

**Events:**
- Emits `ArticlePublished`

**Example:**
```typescript
// Frontend workflow:
// 1. Encrypt article with Seal
const encrypted = await seal.encrypt(content);

// 2. Upload to Walrus
const blobId = await walrus.upload(encrypted);

// 3. Create on-chain article
txb.moveCall({
  target: `${packageId}::article::publish_article`,
  arguments: [
    txb.object(publicationId),
    txb.object(publisherCapId),
    txb.pure.string("My Article"),
    txb.pure.string("Preview..."),
    txb.pure.string(blobId),
    txb.pure.vector('u8', seal.keyId),
    subscription::create_tier_premium(),
    txb.pure.u64(Date.now() / 1000),
  ],
});
```

#### `update_article`
```move
public fun update_article(
    article: &mut Article,
    publisher_cap: &PublisherCap,
    title: String,
    excerpt: String,
)
```

Updates article metadata (title and excerpt only).

**Note:** Cannot update encrypted content, tier, or Walrus blob after publishing.

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match article's publication

**Events:**
- Emits `ArticleUpdated`

#### `archive_article`
```move
public fun archive_article(
    article: &mut Article,
    publisher_cap: &PublisherCap,
)
```

Marks article as archived (hidden from listings).

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match

**Events:**
- Emits `ArticleArchived`

#### `unarchive_article`
```move
public fun unarchive_article(
    article: &mut Article,
    publisher_cap: &PublisherCap,
)
```

Makes archived article visible again.

### Accessor Functions

```move
public fun id(article: &Article): ID
public fun publication_id(article: &Article): ID
public fun title(article: &Article): String
public fun excerpt(article: &Article): String
public fun walrus_blob_id(article: &Article): String
public fun seal_key_id(article: &Article): vector<u8>
public fun tier(article: &Article): Tier
public fun published_at(article: &Article): u64
public fun is_archived(article: &Article): bool
```

---

## subscription

**Source:** `sources/subscription.move`

NFT-based subscriptions with tier-based access and Kiosk integration.

### Enums

#### `Tier`
```move
public enum Tier has copy, drop, store {
    Free,
    Basic,
    Premium,
}
```

### Structs

#### `SubscriptionNFT`
```move
public struct SubscriptionNFT has key, store {
    id: UID,
    publication_id: ID,
    tier: Tier,
    subscribed_at: u64,
    expires_at: u64,
    subscriber: address,
}
```

### Constants

```move
const SECONDS_PER_MONTH: u64 = 30 * 24 * 60 * 60; // 30 days
```

### Functions

#### `subscribe`
```move
public fun subscribe(
    publication: &mut Publication,
    tier: Tier,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
): SubscriptionNFT
```

Creates a new subscription NFT.

**Parameters:**
- `publication` - Publication to subscribe to
- `tier` - Subscription tier (Free/Basic/Premium)
- `payment` - Payment coin (must match tier price)
- `clock` - Shared clock object (0x6)
- `ctx` - Transaction context

**Returns:** `SubscriptionNFT`

**Aborts:**
- `EInvalidTier` if free tier disabled but requested
- `EInsufficientPayment` if payment < required price

**Payment:**
- Free: 0 SUI
- Basic: publication.basic_price
- Premium: publication.premium_price

**Events:**
- Emits `SubscriptionCreated`

**Note:** Caller should also call `analytics::record_subscription()` and `analytics::record_revenue()`

**Example:**
```typescript
const txb = new TransactionBuilder();
const [coin] = txb.splitCoins(txb.gas, [5_000_000_000n]); // 5 SUI

const [subscription] = txb.moveCall({
  target: `${packageId}::subscription::subscribe`,
  arguments: [
    txb.object(publicationId),
    txb.pure.u8(1), // Basic tier
    coin,
    txb.object('0x6'), // Clock
  ],
});

// Transfer to user
txb.transferObjects([subscription], txb.pure.address(userAddress));
```

#### `renew`
```move
public fun renew(
    subscription: &mut SubscriptionNFT,
    publication: &Publication,
    payment: Coin<SUI>,
    clock: &Clock,
    _ctx: &mut TxContext
)
```

Renews an existing subscription by extending expiry.

**Parameters:**
- `subscription` - Subscription to renew
- `publication` - Associated publication
- `payment` - Payment coin
- `clock` - Shared clock object

**Aborts:**
- `EInvalidPublicationId` if subscription doesn't match publication
- `EInsufficientPayment` if payment incorrect

**Behavior:**
- If not expired: extends from current expiry
- If expired: extends from current time

**Events:**
- Emits `SubscriptionRenewed`

#### `is_valid`
```move
public fun is_valid(subscription: &SubscriptionNFT, clock: &Clock): bool
```

Checks if subscription is active (not expired).

**Returns:** `true` if `current_time < expires_at`

#### `has_tier_access`
```move
public fun has_tier_access(
    subscription: &SubscriptionNFT,
    required_tier: Tier,
    clock: &Clock
): bool
```

Verifies subscription has required tier or higher and is not expired.

**Tier Hierarchy:**
- Premium (2) ≥ Basic (1) ≥ Free (0)

**Returns:** `true` if access granted

#### Kiosk Functions

```move
// Place subscription in Kiosk
public fun place_in_kiosk(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription: SubscriptionNFT,
)

// Take subscription from Kiosk
public fun take_from_kiosk(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription_id: ID,
): SubscriptionNFT

// List for sale in Kiosk
public fun list_for_sale(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription_id: ID,
    price: u64,
)
```

### Tier Constructor Functions

```move
public fun create_tier_free(): Tier    // Returns Tier::Free
public fun create_tier_basic(): Tier   // Returns Tier::Basic
public fun create_tier_premium(): Tier // Returns Tier::Premium
```

Use these in TypeScript to construct tier enums.

### Accessor Functions

```move
public fun id(subscription: &SubscriptionNFT): ID
public fun publication_id(subscription: &SubscriptionNFT): ID
public fun tier(subscription: &SubscriptionNFT): Tier
public fun subscribed_at(subscription: &SubscriptionNFT): u64
public fun expires_at(subscription: &SubscriptionNFT): u64
public fun subscriber(subscription: &SubscriptionNFT): address
public fun tier_to_u8_public(tier: &Tier): u8
public fun is_tier_free(tier: &Tier): bool
public fun is_tier_basic(tier: &Tier): bool
public fun is_tier_premium(tier: &Tier): bool
```

---

## access_control

**Source:** `sources/access_control.move`

Manages access permissions and verification for encrypted articles.

### Constants

```move
const TOKEN_VALIDITY_SECONDS: u64 = 24 * 60 * 60; // 24 hours
```

### Structs

#### `ReadToken`
```move
public struct ReadToken has key, store {
    id: UID,
    article_id: ID,
    reader: address,
    created_at: u64,
    expires_at: u64,
}
```

### Functions

#### `verify_subscription_access`
```move
public fun verify_subscription_access(
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock,
): bool
```

Verifies that a user has valid subscription access to an article.

**Checks:**
1. Subscription belongs to article's publication
2. Subscription is not expired
3. Subscription tier ≥ article tier

**Returns:** `true` if all checks pass

#### `generate_read_token`
```move
public fun generate_read_token(
    article: &Article,
    publication: &Publication,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
): ReadToken
```

Generates a 24-hour token for pay-per-article access.

**Parameters:**
- `article` - Article to unlock
- `publication` - Article's publication
- `payment` - Payment coin
- `clock` - Shared clock object
- `ctx` - Transaction context

**Payment Calculation:**
- Free tier: 0 SUI
- Basic tier: `basic_price / 30` (daily rate)
- Premium tier: `premium_price / 30` (daily rate)

**Returns:** `ReadToken` valid for 24 hours

**Aborts:**
- `EInvalidArticleId` if article doesn't belong to publication
- `EInsufficientPayment` if payment < required amount

**Events:**
- Emits `ReadTokenGenerated`

**Example:**
```typescript
// Pay ~0.167 SUI for 24h access to a 5 SUI/month article
const dailyRate = Math.floor(5_000_000_000 / 30);
const [coin] = txb.splitCoins(txb.gas, [dailyRate]);

const [token] = txb.moveCall({
  target: `${packageId}::access_control::generate_read_token`,
  arguments: [
    txb.object(articleId),
    txb.object(publicationId),
    coin,
    txb.object('0x6'),
  ],
});
```

#### `verify_read_token`
```move
public fun verify_read_token(
    token: &ReadToken,
    article: &Article,
    clock: &Clock,
): bool
```

Verifies a read token is valid for accessing an article.

**Checks:**
1. Token is for this article
2. Token is not expired

**Returns:** `true` if valid

#### `has_article_access`
```move
public fun has_article_access(
    article: &Article,
    subscription_opt: &Option<SubscriptionNFT>,
    token_opt: &Option<ReadToken>,
    clock: &Clock,
): bool
```

Checks if a reader has any valid access method.

**Returns:** `true` if either subscription or token grants access

#### `consume_read_token`
```move
public fun consume_read_token(token: ReadToken)
```

Destroys a read token after use (optional - token expires automatically).

#### `record_article_view`
```move
public fun record_article_view(
    stats: &mut PublicationStats,
    article: &Article,
)
```

Records a view in analytics when article is accessed.

**Aborts:**
- `EInvalidArticleId` if stats don't match article's publication

### Accessor Functions

```move
public fun token_article_id(token: &ReadToken): ID
public fun token_reader(token: &ReadToken): address
public fun token_expires_at(token: &ReadToken): u64
public fun is_token_expired(token: &ReadToken, clock: &Clock): bool
```

---

## marketplace_policies

**Source:** `sources/marketplace_policies.move`

Transfer policies for subscription NFT trading with royalty enforcement.

### Constants

```move
const MAX_BPS: u16 = 10_000;           // 100%
const DEFAULT_ROYALTY_BPS: u16 = 1_000; // 10%
```

### Structs

#### `Rule`
```move
public struct Rule has drop {}
```

Witness type for policy authorization.

#### `Config`
```move
public struct Config has store, drop {
    amount_bp: u16,    // Royalty in basis points (1000 = 10%)
    min_amount: u64,   // Minimum royalty in MIST
}
```

### Functions

#### `add_royalty_rule`
```move
public fun add_royalty_rule(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount_bp: u16,
    min_amount: u64
)
```

Adds royalty rule to the transfer policy.

**Parameters:**
- `policy` - Transfer policy to modify
- `cap` - Policy capability (proves ownership)
- `amount_bp` - Royalty percentage in basis points (1000 = 10%)
- `min_amount` - Minimum royalty in MIST

**Aborts:**
- `ERoyaltyTooHigh` if `amount_bp > MAX_BPS` (10000)

**Example:**
```typescript
// Add 10% royalty with 0.1 SUI minimum
txb.moveCall({
  target: `${packageId}::marketplace_policies::add_royalty_rule`,
  arguments: [
    txb.object(policyId),
    txb.object(policyCapId),
    txb.pure.u16(1000), // 10% in BPS
    txb.pure.u64(100_000_000), // 0.1 SUI minimum
  ],
});
```

#### `pay_royalty`
```move
public fun pay_royalty(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    request: &mut TransferRequest<SubscriptionNFT>,
    payment: Coin<SUI>
)
```

Pays royalty fee during subscription transfer.

**Parameters:**
- `policy` - Transfer policy
- `request` - Transfer request (from Kiosk purchase)
- `payment` - Royalty payment coin

**Aborts:**
- `EInsufficientPayment` if payment doesn't match calculated royalty

**Behavior:**
- Calculates royalty from sale price
- Adds payment to policy balance
- Marks rule as satisfied

#### `calculate_royalty_amount`
```move
public fun calculate_royalty_amount(
    policy: &TransferPolicy<SubscriptionNFT>,
    sale_price: u64
): u64
```

Calculates royalty amount from sale price.

**Formula:**
```
percentage_amount = (sale_price * amount_bp) / 10_000
return max(percentage_amount, min_amount)
```

**Returns:** Higher of percentage-based or minimum amount

#### `withdraw_royalties`
```move
public fun withdraw_royalties(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount: Option<u64>,
    ctx: &mut TxContext
): Coin<SUI>
```

Withdraws accumulated royalties from policy.

**Parameters:**
- `amount` - Optional specific amount (None = withdraw all)

**Returns:** Coin with withdrawn amount

#### `remove_royalty_rule`
```move
public fun remove_royalty_rule(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>
)
```

Removes royalty rule from policy.

### Accessor Functions

```move
public fun royalty_bp(policy: &TransferPolicy<SubscriptionNFT>): u16
public fun min_royalty_amount(policy: &TransferPolicy<SubscriptionNFT>): u64
public fun default_royalty_bps(): u16 // Returns 1000 (10%)
```

---

## analytics

**Source:** `sources/analytics.move`

Private analytics for publication creators (metrics not publicly visible).

### Structs

#### `SubscriberCounts`
```move
public struct SubscriberCounts has store, copy, drop {
    free: u64,
    basic: u64,
    premium: u64,
}
```

#### `PublicationStats`
```move
public struct PublicationStats has key, store {
    id: UID,
    publication_id: ID,
    subscriber_counts: SubscriberCounts,
    total_revenue: u64,
    article_views: VecMap<ID, u64>, // article_id -> view count
}
```

### Functions

#### `create_stats`
```move
public fun create_stats(
    publication: &Publication,
    publisher_cap: &PublisherCap,
    ctx: &mut TxContext
): PublicationStats
```

Creates analytics tracking for a publication.

**Parameters:**
- `publication` - Publication to track
- `publisher_cap` - Ownership proof
- `ctx` - Transaction context

**Returns:** `PublicationStats` initialized to zero

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match publication

**Events:**
- Emits `StatsCreated`

**Note:** Call immediately after creating publication.

#### `record_subscription` (package-only)
```move
public(package) fun record_subscription(
    stats: &mut PublicationStats,
    tier: Tier,
)
```

Records a new subscription (increments tier counter).

**Events:**
- Emits `SubscriptionRecorded`

#### `record_revenue` (package-only)
```move
public(package) fun record_revenue(
    stats: &mut PublicationStats,
    amount: u64,
)
```

Records revenue from subscriptions or article sales.

**Events:**
- Emits `RevenueRecorded`

#### `record_view` (package-only)
```move
public(package) fun record_view(
    stats: &mut PublicationStats,
    article_id: ID,
)
```

Increments view count for an article.

#### `get_stats`
```move
public fun get_stats(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
): (SubscriberCounts, u64, VecMap<ID, u64>)
```

Gets full stats (creator-only).

**Returns:** `(subscriber_counts, total_revenue, article_views)`

**Aborts:**
- `EInvalidPublicationId` if cap doesn't match

#### `get_subscriber_counts`
```move
public fun get_subscriber_counts(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
): SubscriberCounts
```

Gets just subscriber counts (creator-only).

#### `get_total_revenue`
```move
public fun get_total_revenue(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
): u64
```

Gets total revenue (creator-only).

#### `get_article_views`
```move
public fun get_article_views(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
    article_id: ID,
): u64
```

Gets views for a specific article (creator-only).

**Returns:** View count (0 if article not found)

### Accessor Functions

```move
public fun publication_id(stats: &PublicationStats): ID
public fun total_subscribers(counts: &SubscriberCounts): u64
public fun free_subscribers(counts: &SubscriberCounts): u64
public fun basic_subscribers(counts: &SubscriberCounts): u64
public fun premium_subscribers(counts: &SubscriberCounts): u64
```

---

## seal_policy

**Source:** `sources/seal_policy.move`

Defines Seal access control policies for encrypted articles.

### Overview

These functions are called by Seal key servers to determine if a user should be granted decryption keys. If the function aborts, key release is denied.

### Functions

#### `seal_approve_subscription`
```move
entry fun seal_approve_subscription(
    id: vector<u8>,
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock,
)
```

Seal policy: Approve decryption based on valid subscription.

**Parameters:**
- `id` - Seal encryption ID from encrypted blob
- `subscription` - User's subscription NFT
- `article` - Article to decrypt
- `clock` - Shared clock object

**Aborts:**
- `EAccessDenied` if seal_key_id mismatch
- `EAccessDenied` if subscription invalid

**Usage:**
```typescript
// Seal server calls this before releasing decryption key
const approved = await client.moveCall({
  target: `${packageId}::seal_policy::seal_approve_subscription`,
  arguments: [
    sealKeyId,
    userSubscriptionId,
    articleId,
    '0x6',
  ],
});
// If successful, server releases key
```

#### `seal_approve_read_token`
```move
entry fun seal_approve_read_token(
    id: vector<u8>,
    token: &ReadToken,
    article: &Article,
    clock: &Clock,
)
```

Seal policy: Approve decryption based on valid read token.

**Parameters:**
- `id` - Seal encryption ID
- `token` - User's read token
- `article` - Article to decrypt
- `clock` - Shared clock object

**Aborts:**
- `EAccessDenied` if seal_key_id mismatch
- `EAccessDenied` if token invalid or expired

---

## treasury

**Source:** `sources/treasury.move`

Manages protocol treasury for collecting fees and deposits.

### Constants

```move
const DEFAULT_SUBSCRIPTION_FEE_BPS: u64 = 100;    // 1%
const DEFAULT_ARTICLE_DEPOSIT_BPS: u64 = 100;     // 1%
const BPS_DENOMINATOR: u64 = 10000;                // Basis points denominator
```

### Structs

#### `Treasury`
```move
public struct Treasury has key {
    id: UID,
    balance: Balance<SUI>,
    subscription_fee_bps: u64,
    article_deposit_bps: u64,
    total_fees_collected: u64,
    total_deposits_collected: u64,
}
```

Shared treasury object holding protocol funds.

#### `TreasuryCap`
```move
public struct TreasuryCap has key, store {
    id: UID,
}
```

Admin capability for treasury management.

### Functions

#### `collect_subscription_fee`
```move
public fun collect_subscription_fee(
    treasury: &mut Treasury,
    payment: &mut Coin<SUI>,
    publication_id: ID,
    subscriber: address,
    ctx: &mut TxContext
): u64
```

Collects protocol fee from subscription payment.

**Parameters:**
- `treasury` - Shared treasury object
- `payment` - Mutable payment coin (fee will be split from this)
- `publication_id` - Publication being subscribed to
- `subscriber` - Subscriber address
- `ctx` - Transaction context

**Returns:** Remaining amount after fee deduction (to be sent to creator)

**Fee Calculation:**
```
fee = payment_amount * subscription_fee_bps / 10000
remaining = payment_amount - fee
```

**Default:** 1% (100 BPS)

**Events:**
- Emits `SubscriptionFeeCollected`

**Example:**
```typescript
// Subscribe with 5 SUI payment
const [coin] = txb.splitCoins(txb.gas, [5_000_000_000n]);

// Collect 1% fee (50,000,000 MIST)
txb.moveCall({
  target: `${packageId}::treasury::collect_subscription_fee`,
  arguments: [
    txb.object(treasuryId),
    coin,
    txb.pure.id(publicationId),
    txb.pure.address(subscriber),
  ],
});

// Remaining 4.95 SUI goes to creator
```

#### `collect_article_deposit`
```move
public fun collect_article_deposit(
    treasury: &mut Treasury,
    deposit: Coin<SUI>,
    publication_id: ID,
    publisher: address,
)
```

Collects deposit for article publishing (non-refundable).

**Parameters:**
- `treasury` - Shared treasury object
- `deposit` - Deposit payment coin (consumed entirely)
- `publication_id` - Publication publishing the article
- `publisher` - Publisher address

**Deposit Amount:**
```
deposit = premium_price * article_deposit_bps / 10000
```

**Default:** 1% of premium tier price

**Aborts:**
- `EZeroAmount` if deposit is zero

**Events:**
- Emits `ArticleDepositCollected`

**Example:**
```typescript
// Calculate deposit (1% of 15 SUI premium price)
const depositAmount = 150_000_000n; // 0.15 SUI

const [depositCoin] = txb.splitCoins(txb.gas, [depositAmount]);

txb.moveCall({
  target: `${packageId}::treasury::collect_article_deposit`,
  arguments: [
    txb.object(treasuryId),
    depositCoin,
    txb.pure.id(publicationId),
    txb.pure.address(publisher),
  ],
});
```

#### `collect_pay_per_article_fee`
```move
public fun collect_pay_per_article_fee(
    treasury: &mut Treasury,
    payment: &mut Coin<SUI>,
    article_id: ID,
    reader: address,
    ctx: &mut TxContext
): u64
```

Collects fee from pay-per-article payment.

**Parameters:**
- `treasury` - Shared treasury object
- `payment` - Mutable payment coin
- `article_id` - Article being purchased
- `reader` - Reader address
- `ctx` - Transaction context

**Returns:** Remaining amount after fee deduction

**Fee:** Same as subscription fee (1% default)

**Events:**
- Emits `PayPerArticleFeeCollected`

#### `withdraw`
```move
public fun withdraw(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
)
```

Withdraws funds from treasury (admin only).

**Parameters:**
- `treasury` - Shared treasury object
- `_cap` - Treasury capability (proves admin authorization)
- `amount` - Amount to withdraw in MIST
- `recipient` - Recipient address
- `ctx` - Transaction context

**Aborts:**
- `EInsufficientBalance` if treasury balance < amount

**Events:**
- Emits `TreasuryWithdrawal`

**Example:**
```typescript
// Withdraw 100 SUI from treasury
txb.moveCall({
  target: `${packageId}::treasury::withdraw`,
  arguments: [
    txb.object(treasuryId),
    txb.object(treasuryCapId),
    txb.pure.u64(100_000_000_000n), // 100 SUI
    txb.pure.address(recipientAddress),
  ],
});
```

#### `update_fee_rates`
```move
public fun update_fee_rates(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
)
```

Updates protocol fee rates (admin only).

**Parameters:**
- `treasury` - Shared treasury object
- `_cap` - Treasury capability
- `new_subscription_fee_bps` - New subscription fee in BPS
- `new_article_deposit_bps` - New article deposit in BPS

**Constraints:**
- Max fee: 10% (1000 BPS)

**Aborts:**
- `EInvalidFeeRate` if fee > 1000 BPS

**Events:**
- Emits `FeeRatesUpdated`

**Example:**
```typescript
// Update fees to 2% (200 BPS)
txb.moveCall({
  target: `${packageId}::treasury::update_fee_rates`,
  arguments: [
    txb.object(treasuryId),
    txb.object(treasuryCapId),
    txb.pure.u64(200), // 2% subscription fee
    txb.pure.u64(200), // 2% article deposit
  ],
});
```

#### `calculate_article_deposit`
```move
public fun calculate_article_deposit(
    treasury: &Treasury,
    premium_price: u64
): u64
```

Calculates required article publishing deposit.

**Parameters:**
- `treasury` - Treasury object (for current deposit rate)
- `premium_price` - Premium tier price of publication

**Returns:** Deposit amount in MIST

**Formula:**
```
deposit = premium_price * article_deposit_bps / 10000
```

**Example:**
```typescript
// Calculate deposit for 15 SUI premium publication
const deposit = await client.devInspectTransactionBlock({
  transactionBlock: txb.moveCall({
    target: `${packageId}::treasury::calculate_article_deposit`,
    arguments: [
      txb.object(treasuryId),
      txb.pure.u64(15_000_000_000n),
    ],
  }),
  sender: address,
});
// Returns: 150_000_000 (0.15 SUI)
```

#### `split_payment_with_fee`
```move
public fun split_payment_with_fee(
    payment: Coin<SUI>,
    fee_bps: u64,
    ctx: &mut TxContext
): (Coin<SUI>, Coin<SUI>)
```

Utility function to split payment into fee and remainder.

**Parameters:**
- `payment` - Payment coin
- `fee_bps` - Fee percentage in basis points
- `ctx` - Transaction context

**Returns:** `(fee_coin, remainder_coin)` tuple

**Example:**
```typescript
// Split 10 SUI with 1% fee
const [payment] = txb.splitCoins(txb.gas, [10_000_000_000n]);

const [feeCoin, remainderCoin] = txb.moveCall({
  target: `${packageId}::treasury::split_payment_with_fee`,
  arguments: [
    payment,
    txb.pure.u64(100), // 1%
  ],
});

// feeCoin = 0.1 SUI
// remainderCoin = 9.9 SUI
```

### Accessor Functions

```move
public fun balance(treasury: &Treasury): u64
public fun subscription_fee_bps(treasury: &Treasury): u64
public fun article_deposit_bps(treasury: &Treasury): u64
public fun total_fees_collected(treasury: &Treasury): u64
public fun total_deposits_collected(treasury: &Treasury): u64
```

---

## Integration Patterns

### Creating a Publication

```typescript
const txb = new TransactionBuilder();

const [publication, publisherCap] = txb.moveCall({
  target: `${packageId}::publication::create_publication`,
  arguments: [
    txb.pure.string("Tech Weekly"),
    txb.pure.string("Weekly tech insights"),
    txb.pure.u64(5_000_000_000n),  // 5 SUI
    txb.pure.u64(15_000_000_000n), // 15 SUI
    txb.pure.bool(true),           // Free tier
  ],
});

// Create analytics
const [stats] = txb.moveCall({
  target: `${packageId}::analytics::create_stats`,
  arguments: [publication, publisherCap],
});

// Transfer objects
txb.transferObjects([publication, publisherCap, stats], sender);
```

### Subscribing

```typescript
const [coin] = txb.splitCoins(txb.gas, [5_000_000_000n]);

const [subscription] = txb.moveCall({
  target: `${packageId}::subscription::subscribe`,
  arguments: [
    txb.object(publicationId),
    txb.pure.u8(1), // Basic
    coin,
    txb.object('0x6'),
  ],
});

txb.transferObjects([subscription], sender);
```

### Publishing Article

```typescript
// 1. Encrypt content
const encrypted = await seal.encrypt(markdown);

// 2. Upload to Walrus
const blobId = await walrus.upload(encrypted);

// 3. Create article
const [article] = txb.moveCall({
  target: `${packageId}::article::publish_article`,
  arguments: [
    txb.object(publicationId),
    txb.object(publisherCapId),
    txb.pure.string(title),
    txb.pure.string(excerpt),
    txb.pure.string(blobId),
    txb.pure.vector('u8', seal.keyId),
    txb.pure.u8(2), // Premium
    txb.pure.u64(Math.floor(Date.now() / 1000)),
  ],
});

txb.transferObjects([article], sender);
```

### Verifying Access

```typescript
// Check subscription
const hasAccess = await client.moveCall({
  target: `${packageId}::access_control::verify_subscription_access`,
  arguments: [
    subscriptionId,
    articleId,
    '0x6',
  ],
});

if (hasAccess) {
  // Request decryption key from Seal server
  const key = await seal.requestKey(article.seal_key_id);

  // Decrypt and display
  const content = await seal.decrypt(walrusBlob, key);
}
```

---

## See Also

- [Data Structures](./DATA_STRUCTURES.md) - Detailed struct documentation
- [Integration Guide](./INTEGRATION_GUIDE.md) - Frontend integration examples
- [Events Reference](./EVENTS.md) - All emitted events
- [Security Guide](./SECURITY.md) - Security best practices
