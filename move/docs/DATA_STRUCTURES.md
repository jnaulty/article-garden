# Data Structures Reference

Detailed documentation of all structs, enums, and data types in the private publishing platform.

## Table of Contents

- [publication Module](#publication-module)
- [article Module](#article-module)
- [subscription Module](#subscription-module)
- [access_control Module](#access_control-module)
- [marketplace_policies Module](#marketplace_policies-module)
- [analytics Module](#analytics-module)
- [treasury Module](#treasury-module)

---

## publication Module

### `Publication`

Represents a publication (e.g., newsletter, blog, content series).

```move
public struct Publication has key, store {
    id: UID,
    name: String,
    description: String,
    creator: address,
    free_tier_enabled: bool,
    basic_price: u64,
    premium_price: u64,
    article_count: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique object identifier |
| `name` | `String` | Publication name (e.g., "Tech Weekly") |
| `description` | `String` | Publication description |
| `creator` | `address` | Publication owner's address |
| `free_tier_enabled` | `bool` | Whether free tier is available |
| `basic_price` | `u64` | Monthly subscription price in MIST (1 SUI = 1_000_000_000 MIST) |
| `premium_price` | `u64` | Monthly premium price in MIST |
| `article_count` | `u64` | Total number of articles published |

**Abilities:**
- `key` - Can be owned or shared
- `store` - Can be stored in other objects or transferred

**Usage Pattern:**
```typescript
// Create publication with 5 SUI basic, 15 SUI premium
const basicPrice = 5_000_000_000n;  // 5 SUI in MIST
const premiumPrice = 15_000_000_000n; // 15 SUI in MIST
```

### `PublisherCap`

Capability object proving ownership of a publication. Required for all privileged operations.

```move
public struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique capability identifier |
| `publication_id` | `ID` | ID of the publication this cap controls |

**Security Model:**

This capability follows the object capability security pattern:
- Only the holder can perform privileged operations
- Cannot be forged or duplicated
- Can be transferred or stored
- Functions verify `publication_id` matches target publication

**Operations Requiring PublisherCap:**
- Publishing articles
- Updating pricing
- Toggling free tier
- Viewing analytics
- Archiving articles

### `PUBLICATION`

One-time witness (OTW) for claiming Publisher.

```move
public struct PUBLICATION has drop {}
```

**Usage:**
- Passed to `init()` function at module deployment
- Used once to claim `Publisher` capability
- Enables creating Display objects and Transfer Policies

---

## article Module

### `Article`

Represents an encrypted article stored on Walrus.

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

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique article identifier |
| `publication_id` | `ID` | Parent publication ID |
| `title` | `String` | Article title (public) |
| `excerpt` | `String` | Preview text (public, ~200 chars) |
| `walrus_blob_id` | `String` | Walrus blob ID for encrypted content |
| `seal_key_id` | `vector<u8>` | Seal encryption key reference |
| `tier` | `Tier` | Required subscription tier for access |
| `published_at` | `u64` | Unix timestamp in seconds |
| `is_archived` | `bool` | Hidden from public listings if true |

**Content Flow:**

```
1. Author writes markdown
   ↓
2. Frontend encrypts with Seal
   → seal_key_id generated
   ↓
3. Upload encrypted blob to Walrus
   → walrus_blob_id returned
   ↓
4. Create Article on-chain
   → Store metadata + blob ID + key ID
   ↓
5. Reader requests access
   ↓
6. Seal server verifies via seal_policy
   ↓
7. If approved, key released
   ↓
8. Reader decrypts and views
```

**Why Separate Metadata?**
- On-chain: Small metadata (title, excerpt, tier)
- Off-chain (Walrus): Large encrypted content
- Reduces on-chain storage costs
- Enables efficient browsing without downloading full articles

**Immutable Fields:**
Once published, these cannot be changed:
- `walrus_blob_id`
- `seal_key_id`
- `tier`
- `published_at`

**Mutable Fields:**
- `title` - Can update via `update_article()`
- `excerpt` - Can update via `update_article()`
- `is_archived` - Can toggle via `archive_article()`

---

## subscription Module

### `Tier` (Enum)

Subscription tier levels with hierarchical access.

```move
public enum Tier has copy, drop, store {
    Free,
    Basic,
    Premium,
}
```

**Variants:**

| Variant | Value (u8) | Price | Access |
|---------|------------|-------|--------|
| `Free` | 0 | 0 SUI | Free-tier articles only |
| `Basic` | 1 | ~5 SUI/month | Free + Basic articles |
| `Premium` | 2 | ~15 SUI/month | All articles |

**Abilities:**
- `copy` - Can be copied
- `drop` - Can be implicitly destroyed
- `store` - Can be stored in structs

**Tier Hierarchy:**

```
Premium (2)
    ↓
  Basic (1)
    ↓
  Free (0)
```

Access is hierarchical: Premium can read Basic and Free content.

**Constructor Functions:**
```typescript
// In TypeScript SDK
const free = subscription::create_tier_free();
const basic = subscription::create_tier_basic();
const premium = subscription::create_tier_premium();
```

### `SubscriptionNFT`

NFT representing a subscription to a publication.

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

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique subscription NFT ID |
| `publication_id` | `ID` | Publication being subscribed to |
| `tier` | `Tier` | Subscription level (Free/Basic/Premium) |
| `subscribed_at` | `u64` | Unix timestamp when subscribed (seconds) |
| `expires_at` | `u64` | Unix timestamp when subscription expires |
| `subscriber` | `address` | Original subscriber (for analytics) |

**Time Calculations:**

```move
const SECONDS_PER_MONTH: u64 = 30 * 24 * 60 * 60; // 2,592,000 seconds

// New subscription
expires_at = current_time + SECONDS_PER_MONTH

// Renewal (not expired)
expires_at = old_expires_at + SECONDS_PER_MONTH

// Renewal (expired)
expires_at = current_time + SECONDS_PER_MONTH
```

**Lifecycle:**

```
Subscribe → Active → Expire → Renew
    ↓         ↓
  Place    Access
    ↓      Articles
  Kiosk      ↓
    ↓     Decrypt
  List       ↓
    ↓     Verify
  Sell
```

**Kiosk Integration:**

SubscriptionNFTs can be:
- Placed in personal Kiosk
- Listed for sale at custom price
- Traded on secondary market
- Subject to transfer policy royalties

**Tradability:**

The subscription can be sold even if:
- Time remaining on subscription
- Buyer continues with same tier and expiry
- Creator earns royalty (10-15%)
- Useful for users who no longer want subscription

---

## access_control Module

### `ReadToken`

Temporary access token for pay-per-article reading.

```move
public struct ReadToken has key, store {
    id: UID,
    article_id: ID,
    reader: address,
    created_at: u64,
    expires_at: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique token identifier |
| `article_id` | `ID` | Specific article this token unlocks |
| `reader` | `address` | Address of reader (for analytics) |
| `created_at` | `u64` | Unix timestamp when token created |
| `expires_at` | `u64` | Unix timestamp when token expires |

**Duration:**

```move
const TOKEN_VALIDITY_SECONDS: u64 = 24 * 60 * 60; // 24 hours
```

**Pricing:**

```move
// Daily rate = monthly price / 30 days
if tier == Free:
    price = 0
else if tier == Basic:
    price = publication.basic_price / 30
else: // Premium
    price = publication.premium_price / 30

// Example: 5 SUI/month = 0.167 SUI/day
```

**Use Case:**

Reader wants to read a single article without subscribing:
1. Pay daily rate (~0.167 SUI for Basic)
2. Receive ReadToken valid 24 hours
3. Can read that article unlimited times in 24h
4. Token expires or can be consumed

**vs Subscription:**

| Feature | ReadToken | Subscription |
|---------|-----------|--------------|
| Duration | 24 hours | 30 days |
| Access | Single article | All tier articles |
| Price | ~1/30 of monthly | Full monthly price |
| Tradable | No | Yes (via Kiosk) |
| Renewable | No | Yes |

---

## marketplace_policies Module

### `Rule`

Witness type for authorizing transfer policy rules.

```move
public struct Rule has drop {}
```

**Purpose:**
- Authorizes adding/removing rules from policies
- Used with `TransferPolicy<SubscriptionNFT>`
- Ensures only this module can modify its rules

**Abilities:**
- `drop` - Can be discarded after use

### `Config`

Configuration for royalty rule in transfer policies.

```move
public struct Config has store, drop {
    amount_bp: u16,
    min_amount: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `amount_bp` | `u16` | Royalty percentage in basis points (10000 = 100%) |
| `min_amount` | `u64` | Minimum royalty amount in MIST |

**Basis Points (BPS):**

```
1 BPS = 0.01%
100 BPS = 1%
1000 BPS = 10%
10000 BPS = 100%
```

**Examples:**

| BPS | Percentage | On 10 SUI Sale |
|-----|------------|----------------|
| 500 | 5% | 0.5 SUI |
| 1000 | 10% | 1 SUI |
| 1500 | 15% | 1.5 SUI |

**Calculation:**

```move
percentage_amount = (sale_price * amount_bp) / 10_000
royalty = max(percentage_amount, min_amount)
```

**Example Config:**

```typescript
{
  amount_bp: 1000,      // 10%
  min_amount: 100_000_000, // 0.1 SUI minimum
}

// Sale for 2 SUI
// 10% = 0.2 SUI > 0.1 SUI minimum → 0.2 SUI royalty

// Sale for 0.5 SUI
// 10% = 0.05 SUI < 0.1 SUI minimum → 0.1 SUI royalty
```

---

## analytics Module

### `SubscriberCounts`

Breakdown of subscribers by tier.

```move
public struct SubscriberCounts has store, copy, drop {
    free: u64,
    basic: u64,
    premium: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `free` | `u64` | Number of free-tier subscribers |
| `basic` | `u64` | Number of basic-tier subscribers |
| `premium` | `u64` | Number of premium-tier subscribers |

**Abilities:**
- `store` - Can be stored in PublicationStats
- `copy` - Can be copied when returned
- `drop` - Can be implicitly destroyed

**Total Calculation:**

```move
total_subscribers = free + basic + premium
```

### `PublicationStats`

Private analytics for a publication (creator-only access).

```move
public struct PublicationStats has key, store {
    id: UID,
    publication_id: ID,
    subscriber_counts: SubscriberCounts,
    total_revenue: u64,
    article_views: VecMap<ID, u64>,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique stats object ID |
| `publication_id` | `ID` | Publication being tracked |
| `subscriber_counts` | `SubscriberCounts` | Breakdown by tier |
| `total_revenue` | `u64` | Cumulative earnings in MIST |
| `article_views` | `VecMap<ID, u64>` | Map of article_id → view count |

**Privacy Model:**

All functions require `PublisherCap` to access:
```move
public fun get_stats(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
): (SubscriberCounts, u64, VecMap<ID, u64>)
```

Only the publication creator can view:
- Subscriber counts
- Revenue totals
- Article views

**Revenue Tracking:**

```move
// On subscription
total_revenue += subscription_price

// On renewal
total_revenue += renewal_price

// On pay-per-article
total_revenue += article_price
```

**View Tracking:**

```typescript
// Each time article is accessed
article_views[article_id] += 1

// Query views
const views = get_article_views(stats, publisher_cap, article_id);
```

**Why VecMap?**

- Dynamic size (grows as articles added)
- Efficient lookup by article ID
- On-chain storage for real-time queries
- Alternative: Could use off-chain indexer

---

## Type Relationships

### Object Ownership Graph

```
Publication (shared)
    ↑
    │ references
    │
Article (shared)
    ↑
    │ needs access to
    │
SubscriptionNFT (owned)
    │
    │ stored in
    ↓
Kiosk (shared)
```

### Access Control Flow

```
Reader
    │
    ├─→ has SubscriptionNFT?
    │   └─→ verify_subscription_access()
    │       ├─→ Check publication_id
    │       ├─→ Check expiry
    │       └─→ Check tier
    │
    └─→ has ReadToken?
        └─→ verify_read_token()
            ├─→ Check article_id
            └─→ Check expiry
```

### Capability Pattern

```
PublisherCap
    │
    ├─→ Guards publication operations
    │   ├─→ update_pricing()
    │   ├─→ toggle_free_tier()
    │   └─→ publish_article()
    │
    └─→ Guards analytics access
        ├─→ get_stats()
        ├─→ get_subscriber_counts()
        └─→ get_total_revenue()
```

---

## Size Estimates

### On-Chain Storage

| Struct | Approximate Size | Storage Cost |
|--------|-----------------|--------------|
| `Publication` | ~200 bytes | ~0.0002 SUI |
| `Article` | ~300 bytes | ~0.0003 SUI |
| `SubscriptionNFT` | ~150 bytes | ~0.00015 SUI |
| `PublisherCap` | ~50 bytes | ~0.00005 SUI |
| `ReadToken` | ~100 bytes | ~0.0001 SUI |
| `PublicationStats` | ~500+ bytes | ~0.0005+ SUI |

**Note:** Actual costs depend on content length (strings, vectors) and network fees.

### Off-Chain Storage (Walrus)

| Content Type | Size | Storage Cost |
|-------------|------|--------------|
| Short article | ~10 KB | Varies |
| Medium article | ~50 KB | Varies |
| Long article with images | ~500 KB | Varies |

---

## treasury Module

### `Treasury`

Shared treasury object holding protocol funds.

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

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique treasury identifier |
| `balance` | `Balance<SUI>` | Treasury balance holding collected funds |
| `subscription_fee_bps` | `u64` | Subscription fee rate in basis points (default: 100 = 1%) |
| `article_deposit_bps` | `u64` | Article deposit rate in basis points (default: 100 = 1%) |
| `total_fees_collected` | `u64` | Cumulative subscription/pay-per-article fees in MIST |
| `total_deposits_collected` | `u64` | Cumulative article deposits in MIST |

**Abilities:**
- `key` - Can be shared globally

**Sharing Model:**

Treasury is a shared object accessible by all users:
```move
// Created in init()
transfer::share_object(treasury);
```

**Why Shared?**
- Multiple users need simultaneous access
- Fee collection happens during subscriptions
- No contention for reads (only writes need synchronization)
- Simpler than passing around mutable references

**Fee Structure:**

```
Subscription Payment Flow:
User pays 5 SUI → Treasury takes 1% (0.05 SUI) → Creator receives 4.95 SUI

Article Deposit Flow:
Publisher pays 0.15 SUI (1% of 15 SUI premium) → Treasury takes entire deposit

Pay-Per-Article Flow:
Reader pays ~0.167 SUI → Treasury takes 1% → Creator receives remainder
```

**Revenue Tracking:**

```move
// Subscription fees and pay-per-article fees
total_fees_collected += fee_amount

// Article publishing deposits
total_deposits_collected += deposit_amount
```

**Basis Points (BPS):**

```
1 BPS = 0.01%
100 BPS = 1%
1000 BPS = 10%
10000 BPS = 100%

Calculation:
fee = amount * fee_bps / 10000
```

**Example Calculations:**

| Amount | Fee Rate | Calculation | Result |
|--------|----------|-------------|--------|
| 5 SUI | 100 BPS (1%) | 5 * 100 / 10000 | 0.05 SUI |
| 15 SUI | 200 BPS (2%) | 15 * 200 / 10000 | 0.3 SUI |
| 0.5 SUI | 100 BPS (1%) | 0.5 * 100 / 10000 | 0.005 SUI |

**Security Considerations:**

- Maximum fee rate capped at 10% (1000 BPS)
- Only TreasuryCap holder can withdraw funds
- All fee changes emit events for transparency
- Balance uses Sui's `Balance<T>` for safety

### `TreasuryCap`

Admin capability for treasury management.

```move
public struct TreasuryCap has key, store {
    id: UID,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UID` | Unique capability identifier |

**Abilities:**
- `key` - Can be owned/transferred
- `store` - Can be stored in other objects

**Security Model:**

The TreasuryCap follows the capability pattern:
- Created once during module initialization
- Transferred to deployer
- Required for all admin operations
- Cannot be forged or duplicated
- Can be transferred to new admin if needed

**Operations Requiring TreasuryCap:**

```move
// Withdraw funds
withdraw(treasury, cap, amount, recipient, ctx)

// Update fee rates
update_fee_rates(treasury, cap, new_sub_fee, new_deposit_fee)
```

**Admin Transfer:**

```typescript
// Transfer admin rights to new address
txb.transferObjects([treasuryCapId], newAdminAddress);
```

**Multi-Sig Admin:**

TreasuryCap can be stored in a multi-sig wallet for decentralized governance:

```move
// Store cap in multi-sig object
multi_sig::add_capability(multi_sig_wallet, treasury_cap);
```

**Emergency Response:**

If admin key is compromised:
1. Cannot mint new TreasuryCap (unforgeable)
2. Can only withdraw existing balance
3. Cannot modify fee rates beyond 10% max
4. All actions emit audit events

**Lifecycle:**

```
Deploy → init() → TreasuryCap created
   ↓
Transfer to deployer
   ↓
[Optional] Transfer to DAO/Multi-sig
   ↓
Use for withdrawals and fee updates
```

---

## Design Decisions

### Why Enum for Tier?

**Pros:**
- Type-safe tier values
- Clear intent in code
- Efficient comparison
- Future-proof (can add tiers)

**Cons:**
- Slightly more verbose than u8
- Requires helper functions

### Why Separate PublisherCap?

**Capability Pattern Benefits:**
- Clear ownership model
- Transferable independently
- Can be delegated to managers
- Cannot be forged
- Follows Move best practices

### Why Store Walrus Blob ID?

**vs Storing Content On-Chain:**
- Cost: 1 KB on-chain ≈ 500 KB on Walrus
- Speed: Parallel Walrus retrieval
- Privacy: Encrypted off-chain
- Scalability: Unlimited article size

### Why VecMap for Article Views?

**vs Table:**
- Simpler API
- Suitable for moderate article counts
- Ordered traversal possible
- Lower overhead

**Future:** Could migrate to `Table` for publications with 1000+ articles.

---

## See Also

- [Module API](./MODULE_API.md) - Function signatures and usage
- [Events Reference](./EVENTS.md) - All emitted events
- [Integration Guide](./INTEGRATION_GUIDE.md) - TypeScript examples
- [Security Guide](./SECURITY.md) - Security considerations
