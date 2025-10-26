# Architecture Guide

## Deployment Information

**Current Deployment:**
- **Network**: Sui Testnet
- **Package ID**: `0x93d858ad26012ee80a48d1c07dc811966a6b06b2830c8972b4178df213b9b306`
- **Deployment Transaction**: `45KCNRkCyx8qGNavHq1aApYqWtkVoHLGiRjhcsUjtwL3`
- **Status**: ✅ Production-validated with end-to-end decryption tested
- **Last Updated**: January 2025

## System Overview

The Private Publishing Platform is built on three core Sui primitives:

1. **Seal** - End-to-end encryption for content
2. **Walrus** - Decentralized storage for encrypted articles
3. **Kiosk + Transfer Policies** - NFT subscriptions with royalties

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │  Writer UI │  │  Reader UI │  │  Marketplace UI     │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
│         │               │                     │             │
│         └───────────────┴─────────────────────┘             │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
              ┌───────────┴──────────┐
              │                      │
              ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐
│  Sui Blockchain      │  │  Walrus Storage      │
│  ┌────────────────┐  │  │  ┌────────────────┐ │
│  │  Publications  │  │  │  │  Encrypted     │ │
│  │  Subscriptions │  │  │  │  Articles      │ │
│  │  Analytics     │  │  │  │  (Blob IDs)    │ │
│  └────────────────┘  │  │  └────────────────┘ │
└──────────────────────┘  └──────────────────────┘
           │
           │ Seal Encryption
           ▼
┌──────────────────────┐
│  Seal Service        │
│  ┌────────────────┐  │
│  │  Session Keys  │  │
│  │  Encryption    │  │
│  │  Decryption    │  │
│  └────────────────┘  │
└──────────────────────┘
```

## Component Breakdown

### 1. Move Modules (On-Chain)

#### `publication.move`
**Purpose**: Manage publication lifecycle

**Key Structures**:
```move
public struct Publication has key {
    id: UID,
    name: String,
    description: String,
    creator: address,
    free_tier_enabled: bool,
    basic_price: u64,      // MIST
    premium_price: u64,    // MIST
    article_count: u64,
}

public struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
}
```

**Functions**:
- `create_publication()` - Initialize new publication
- `update_pricing()` - Change subscription prices
- `toggle_free_tier()` - Enable/disable free tier

#### `subscription.move`
**Purpose**: Handle subscription NFTs and Kiosk integration

**Key Structures**:
```move
public struct SubscriptionNFT has key, store {
    id: UID,
    publication_id: ID,
    tier: Tier,
    subscribed_at: u64,
    expires_at: u64,
    auto_renew: bool,
}

public enum Tier has copy, drop, store {
    Free,
    Basic,
    Premium,
}
```

**Functions**:
- `subscribe()` - Mint new subscription NFT
- `renew()` - Extend subscription
- `place_in_kiosk()` - Store subscription in user's Kiosk
- `list_for_sale()` - List subscription on marketplace

#### `article.move`
**Purpose**: Manage encrypted articles

**Key Structures**:
```move
public struct Article has key {
    id: UID,
    publication_id: ID,
    title: String,
    excerpt: String,          // Public preview
    walrus_blob_id: String,   // Encrypted content location
    seal_key_id: vector<u8>,  // Encryption key reference
    tier: Tier,               // Required access level
    published_at: u64,
}
```

**Functions**:
- `publish_article()` - Create new article
- `update_article()` - Modify article metadata
- `archive_article()` - Hide from listings

#### `access_control.move`
**Purpose**: Verify reader permissions

**Key Structures**:
```move
public struct ReadToken has key {
    id: UID,
    article_id: ID,
    reader: address,
    created_at: u64,
    expires_at: u64,
}
```

**Functions**:
- `verify_subscription()` - Check if user has valid subscription
- `check_tier_access()` - Verify tier matches article requirement
- `generate_read_token()` - Issue temporary access token
- `is_token_valid()` - Validate read token

#### `seal_policy.move`
**Purpose**: Seal key server access control policies

**Key Functions**:
```move
entry fun seal_approve_subscription(
    id: vector<u8>,           // Seal encryption ID
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock,
)

entry fun seal_approve_read_token(
    id: vector<u8>,           // Seal encryption ID
    token: &ReadToken,
    article: &Article,
    clock: &Clock,
)
```

**Implementation Details**:
- Called by Seal key servers during decryption
- Validates the Seal encryption ID matches `article.seal_key_id`
- **Important**: Compares against `seal_key_id` field, NOT the Article object ID
- Returns success (key released) or aborts (access denied)
- Integrates with `access_control` module for subscription/token validation

#### `marketplace_policies.move`
**Purpose**: Transfer policies for subscription trading

**Key Structures**:
```move
public struct SubscriptionPolicy has key {
    id: UID,
    publication_id: ID,
    royalty_bps: u64,        // 1000 = 10%
    creator: address,
    min_transfer_price: u64,
}
```

**Functions**:
- `create_policy()` - Set up transfer rules
- `enforce_royalty()` - Take royalty cut on transfers
- `update_royalty()` - Adjust royalty percentage

#### `analytics.move`
**Purpose**: Private metrics for creators

**Key Structures**:
```move
public struct PublicationStats has key {
    id: UID,
    publication_id: ID,
    subscriber_counts: SubscriberCounts,
    revenue_total: u64,
    article_views: VecMap<ID, u64>,  // article_id -> view_count
}

public struct SubscriberCounts has store {
    free: u64,
    basic: u64,
    premium: u64,
}
```

**Functions** (creator-only):
- `get_stats()` - Retrieve analytics
- `record_subscription()` - Update counts
- `record_view()` - Increment view counter

### 2. Frontend Architecture

#### React Component Tree

```
App
├── Providers
│   ├── QueryClientProvider
│   ├── SuiClientProvider
│   ├── WalletProvider
│   ├── SessionKeyProvider (Seal)
│   └── PublishingClientProvider
│
├── Layout
│   ├── Header (wallet connect)
│   └── Footer
│
└── Pages
    ├── Home
    ├── PublicationList
    ├── PublicationDetail
    ├── ArticleReader (encrypted)
    ├── Subscribe
    ├── MySubscriptions (Kiosk view)
    ├── PublisherDashboard
    ├── CreatePublication
    ├── WriteArticle (markdown + encrypt)
    ├── Analytics (creator-only)
    └── SubscriptionMarketplace
```

#### Key Providers

**SessionKeyProvider**
- Manages Seal session keys
- 30-minute TTL
- Auto-refresh on expiry
- Persists to localStorage

**PublishingClientProvider**
- Combines Seal + Walrus + Sui clients
- Provides unified publishing API
- Handles encryption/decryption

#### Custom Hooks

**usePublication**
```typescript
const {
  publications,
  create,
  update,
  publish,
  isLoading,
} = usePublication();
```

**useSubscription**
```typescript
const {
  subscribe,
  renew,
  listForSale,
  mySubscriptions,
  checkAccess,
} = useSubscription();
```

**useEncryptedArticle**
```typescript
const {
  article,
  decrypt,
  isDecrypting,
  error,
} = useEncryptedArticle(articleId);
```

**useWalrus**
```typescript
const {
  upload,
  download,
  isUploading,
} = useWalrus();
```

### 3. Data Flow

#### Publishing Flow

```
1. Writer creates article in markdown editor
   ↓
2. Frontend encrypts content with Seal
   - Uses writer's session key
   - Generates encryption key
   ↓
3. Upload encrypted blob to Walrus
   - Returns blob_id
   ↓
4. Create Article on-chain
   - Store blob_id
   - Store seal_key_id
   - Set tier requirement
   ↓
5. Article visible to subscribers
```

#### Reading Flow

```
1. Reader navigates to article
   ↓
2. Frontend checks access
   - Query user's SubscriptionNFT from Kiosk
   - Verify tier matches article requirement
   - Check expiry
   ↓
3. If valid, fetch encrypted content
   - Get blob_id from Article object
   - Download from Walrus
   ↓
4. Decrypt with Seal
   - Use reader's session key
   - Decrypt with article's seal_key_id
   ↓
5. Display decrypted markdown
```

#### Subscription Flow

```
1. Reader selects tier (Basic/Premium)
   ↓
2. Payment transaction
   - Split coins for payment
   - Send to publication creator
   ↓
3. Mint SubscriptionNFT
   - Set tier, expiry, publication_id
   ↓
4. Place in reader's Kiosk
   - Apply transfer policy
   - Enable secondary trading
   ↓
5. Reader can now access content
```

## Security Model

### Access Control

**Three-Layer Verification**:

1. **On-Chain**: Smart contract verifies subscription ownership
2. **Encryption**: Seal ensures only valid subscribers can decrypt
3. **Session**: Time-limited access via session keys

### Privacy Guarantees

**For Readers**:
- zkLogin allows anonymous wallet creation
- Subscription doesn't reveal real identity
- Reading activity not tracked on-chain
- Payment source hidden via coin splitting

**For Writers**:
- Subscriber counts encrypted
- Revenue private (only creator sees)
- No public metrics dashboard

### Encryption

**Content Encryption**:
- AES-256-GCM via Seal
- Unique key per article
- Key stored encrypted on-chain
- Decryption requires valid session key

**Session Keys**:
- 30-minute TTL
- Derived from wallet signature
- Stored in browser localStorage
- Auto-expire and refresh

## Scalability

### On-Chain Optimization

**Shared vs Owned Objects**:
- `Publication` - Shared (multiple writers possible)
- `Article` - Owned by publication
- `SubscriptionNFT` - Owned by subscriber
- `PublicationStats` - Shared (frequent updates)

**Gas Efficiency**:
- Batch article publishing
- Lazy subscription renewal
- Minimal on-chain storage

### Off-Chain Storage

**Walrus Benefits**:
- Decentralized blob storage
- No single point of failure
- Cost-effective for large content
- Built-in redundancy

**Content Strategy**:
- Only metadata on-chain
- Full articles on Walrus
- Images/media on Walrus
- Thumbnails on-chain (small)

## Upgrade Path

### Smart Contract Upgrades

**Planned Enhancements**:
1. Add comments (encrypted)
2. Add reactions/likes
3. Add article series support
4. Add subscriber chat

**Migration Strategy**:
- Use upgrade capabilities
- Maintain backward compatibility
- Gradual feature rollout

### Frontend Upgrades

**Progressive Enhancement**:
1. Start with basic read/write
2. Add rich markdown features
3. Add collaborative editing
4. Add mobile apps

## Production Validation & Lessons Learned

### ✅ Validated Features

The following features have been tested end-to-end on Sui Testnet with production data:

1. **Article Encryption & Publishing**
   - ✅ Client-side encryption with Seal Protocol
   - ✅ Walrus blob upload with quilt container
   - ✅ On-chain article creation with metadata
   - ✅ Seal encryption ID storage in `seal_key_id` field

2. **Content Retrieval & Decryption**
   - ✅ Walrus blob fetching via HTTP aggregator
   - ✅ Quilt container parsing and file extraction
   - ✅ Seal key server access control validation
   - ✅ Successful decryption with valid subscription

3. **Access Control Enforcement**
   - ✅ Subscription verification on-chain
   - ✅ Seal policy enforcement by key servers
   - ✅ 403 rejection for invalid access attempts

### Critical Bug Fixes

#### 1. Walrus Quilt Decryption Fix

**Problem**: Encrypted data was wrapped in a Walrus "quilt" container during upload, but retrieval attempted to parse raw bytes directly, causing decryption failure.

**Root Cause**:
- `writeFilesFlow()` automatically encodes files in a quilt format with metadata
- HTTP aggregator returns the quilt container, not the raw file
- Direct bytes parsing failed because quilt header was included

**Solution**:
```typescript
// Before: Direct bytes extraction (BROKEN)
const encryptedData = await blob.arrayBuffer();

// After: Parse quilt and extract file (WORKS)
const quiltBlob = WalrusBlob.fromExisting({ ... });
const files = await quiltBlob.files();
const encryptedData = await files[0].bytes();
```

**Files Changed**:
- `private-publishing-dapp/src/services/walrus.ts`
- Added quilt parsing logic to `fetchFromWalrus()`

**Validation**: Production logs show identical bytes before encryption and after quilt extraction, confirming data integrity.

**Documentation**: See `docs/WALRUS_QUILT_FIX.md` for detailed analysis.

#### 2. Seal Access Control ID Mismatch Fix

**Problem**: Key servers returned 403 Forbidden during decryption despite valid subscriptions.

**Root Cause**:
- Seal encryption happens *before* Article object creation, using a random hex ID
- Article object gets a different ID assigned by Sui when created on-chain
- `seal_policy.move` compared Seal encryption ID against Article's object ID (wrong)
- IDs never matched, causing all decryption attempts to fail

**Solution**:
```move
// Before: Compared against article object ID (BROKEN)
let article_id = article::id(article);
let article_id_bytes = bcs::to_bytes(&article_id);
assert!(id == article_id_bytes, EAccessDenied);

// After: Compare against stored seal_key_id (WORKS)
let seal_key_id = article::seal_key_id(article);
assert!(id == seal_key_id, EAccessDenied);
```

**Files Changed**:
- `move/sources/seal_policy.move` (seal_approve_subscription + seal_approve_read_token)
- Removed unused `sui::bcs` import

**Validation**: Subscription NFT verified on-chain (valid tier, not expired), decryption now succeeds.

**Documentation**: See `docs/SEAL_ACCESS_CONTROL_403.md` for complete root cause analysis.

### Key Insights

1. **Walrus Storage Format**: Always assume `writeFilesFlow()` produces quilts, not raw bytes
2. **ID Separation**: Seal encryption IDs and object IDs must be treated as separate identifiers
3. **The `seal_key_id` Field Purpose**: Exists specifically to bridge encryption IDs with object IDs
4. **End-to-End Testing is Essential**: Unit tests passed, but integration revealed subtle issues

### Troubleshooting Guide

**Issue**: "Encrypted object contains no key server metadata"
- **Cause**: Parsing quilt wrapper as raw Seal bytes
- **Fix**: Use `WalrusBlob.files()` to extract unwrapped file
- **Reference**: `docs/WALRUS_QUILT_FIX.md`

**Issue**: "NoAccessError: User does not have access" (403)
- **Cause**: Seal policy comparing wrong IDs
- **Fix**: Ensure `seal_policy` uses `article::seal_key_id()`
- **Reference**: `docs/SEAL_ACCESS_CONTROL_403.md`

**Issue**: Session key expired
- **Cause**: 30-minute TTL on Seal sessions
- **Fix**: Call `initializeSession()` to refresh, happens automatically in provider

**Issue**: Walrus blob not found
- **Cause**: Epoch expired or network latency
- **Fix**: Implement retry with exponential backoff, check epoch status

## Deployment Strategy

### Testnet Deployment ✅ COMPLETE

1. ✅ Deploy Move modules
2. ✅ Create test publications
3. ✅ Mint test subscriptions
4. ✅ Verify encryption works end-to-end
5. ⏸️ Test marketplace trading (Phase 3)

**Current Package**: `0x93d858ad26012ee80a48d1c07dc811966a6b06b2830c8972b4178df213b9b306`

### Mainnet Deployment (Pending)

1. Audit smart contracts (security review)
2. Deploy to mainnet with upgrade capability
3. Verify all object IDs and configurations
4. Update frontend config with mainnet package ID
5. Monitor gas costs and optimize if needed
6. Gradual user onboarding with beta testing
7. Establish dedicated Seal key server infrastructure (currently using Mysten testnet servers)

## Monitoring & Maintenance

### Metrics to Track

**On-Chain**:
- Total publications
- Active subscriptions
- Transaction volume
- Gas consumption

**Off-Chain**:
- Walrus storage usage
- Encryption/decryption times
- Session key refresh rate
- Error rates

### Support & Debugging

**Common Issues**:
- Session key expiry → Refresh
- Walrus download fail → Retry with backoff
- Decryption fail → Verify subscription
- Gas estimation → Adjust buffer

---

**This architecture prioritizes**:
- ✅ Privacy by default (Seal + zkLogin)
- ✅ Decentralization (Walrus)
- ✅ User ownership (Kiosk + NFTs)
- ✅ Creator monetization (Transfer policies)
