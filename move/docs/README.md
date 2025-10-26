# Private Publishing Platform - Move Smart Contracts

Comprehensive documentation for the Move smart contracts powering the private publishing platform.

## Overview

This platform enables creators to publish encrypted content with subscription-based access control. Built on Sui blockchain, it leverages:

- **Seal** - End-to-end encryption for articles
- **Walrus** - Decentralized content storage
- **Kiosk** - NFT-based subscription management
- **Transfer Policies** - Royalty enforcement for subscription resales

## Module Architecture

```
private_publishing/
├── publication.move         # Core publication management
├── article.move            # Encrypted article publishing
├── subscription.move       # NFT-based subscriptions
├── access_control.move     # Permission verification
├── marketplace_policies.move # Royalty enforcement
├── analytics.move          # Private creator metrics
├── seal_policy.move        # Seal decryption policies
└── treasury.move           # Protocol treasury & fee collection
```

## Quick Reference

### Module: `publication`

Manages publications and publisher capabilities.

**Key Structs:**
- `Publication` - Represents a publication (newsletter, blog, etc.)
- `PublisherCap` - Capability proving publication ownership
- `PUBLICATION` - One-time witness for Publisher claim

**Key Functions:**
- `create_publication()` - Create new publication
- `update_pricing()` - Update subscription tiers
- `toggle_free_tier()` - Enable/disable free tier

[→ Full API Reference](./MODULE_API.md#publication)

### Module: `article`

Manages encrypted articles stored on Walrus.

**Key Structs:**
- `Article` - Encrypted article with Walrus blob reference

**Key Functions:**
- `publish_article()` - Publish encrypted article
- `update_article()` - Update article metadata
- `archive_article()` - Hide article from listings

[→ Full API Reference](./MODULE_API.md#article)

### Module: `subscription`

NFT-based subscriptions with tier-based access.

**Key Structs:**
- `SubscriptionNFT` - Subscription with expiry timestamp
- `Tier` - Enum: Free, Basic, Premium

**Key Functions:**
- `subscribe()` - Create subscription NFT
- `renew()` - Extend subscription
- `is_valid()` - Check if subscription is active
- `has_tier_access()` - Verify tier permissions

[→ Full API Reference](./MODULE_API.md#subscription)

### Module: `access_control`

Permission verification and temporary access tokens.

**Key Structs:**
- `ReadToken` - 24-hour single-article access

**Key Functions:**
- `verify_subscription_access()` - Validate subscription
- `generate_read_token()` - Create pay-per-article token
- `verify_read_token()` - Validate token

[→ Full API Reference](./MODULE_API.md#access_control)

### Module: `marketplace_policies`

Transfer policies with royalty enforcement for subscription trading.

**Key Structs:**
- `Rule` - Policy rule witness
- `Config` - Royalty configuration (BPS + minimum)

**Key Functions:**
- `add_royalty_rule()` - Add royalty to policy
- `pay_royalty()` - Pay royalty during transfer
- `calculate_royalty_amount()` - Compute royalty

[→ Full API Reference](./MODULE_API.md#marketplace_policies)

### Module: `analytics`

Private analytics for publication creators.

**Key Structs:**
- `PublicationStats` - Subscriber counts, revenue, views
- `SubscriberCounts` - Breakdown by tier

**Key Functions:**
- `create_stats()` - Initialize analytics
- `record_subscription()` - Track new subscriber
- `record_revenue()` - Track earnings
- `record_view()` - Track article views

[→ Full API Reference](./MODULE_API.md#analytics)

### Module: `seal_policy`

Seal key server policies for decryption authorization.

**Key Functions:**
- `seal_approve_subscription()` - Approve decryption via subscription
- `seal_approve_read_token()` - Approve decryption via token

[→ Full API Reference](./MODULE_API.md#seal_policy)

### Module: `treasury`

Protocol treasury for fee collection and management.

**Key Structs:**
- `Treasury` - Shared treasury holding protocol funds
- `TreasuryCap` - Admin capability for treasury management

**Key Functions:**
- `collect_subscription_fee()` - Collect 1% fee from subscriptions (modifies payment coin)
- `collect_article_deposit()` - Collect deposit from article publishing (1% of premium price)
- `collect_pay_per_article_fee()` - Collect fee from pay-per-article payments
- `withdraw()` - Withdraw funds (admin only, requires TreasuryCap)
- `update_fee_rates()` - Update fee rates (admin only, max 10%)
- `calculate_article_deposit()` - Calculate required deposit for article publishing

**Fee Structure:**
- Subscription fee: 1% (100 BPS) - taken from subscription payments
- Article deposit: 1% (100 BPS) - calculated from premium tier price
- Pay-per-article fee: 1% (100 BPS) - taken from article purchase
- All fees configurable (max 10%)

[→ Full API Reference](./MODULE_API.md#treasury)

## Error Codes

### publication.move
- `EInvalidPrice = 1` - Premium price must be >= basic price
- `EInvalidPublicationId = 2` - PublisherCap doesn't match Publication

### subscription.move
- `EInvalidTier = 1` - Invalid tier or free tier disabled
- `EInsufficientPayment = 2` - Payment less than required
- `EInvalidPublicationId = 3` - Subscription doesn't match publication

### article.move
- `EInvalidPublicationId = 1` - PublisherCap doesn't match article

### access_control.move
- `EInsufficientPayment = 1` - Payment less than required for token
- `EInvalidArticleId = 2` - Article doesn't belong to publication

### marketplace_policies.move
- `EInsufficientPayment = 1` - Royalty payment incorrect
- `ERoyaltyTooHigh = 2` - Royalty exceeds 100%

### seal_policy.move
- `EAccessDenied = 1` - User lacks valid subscription or token

### treasury.move
- `EInsufficientBalance = 1` - Treasury balance insufficient for withdrawal
- `EInvalidFeeRate = 2` - Fee rate exceeds maximum (10%)
- `EZeroAmount = 3` - Deposit amount must be greater than zero

## Documentation Index

- **[MODULE_API.md](./MODULE_API.md)** - Complete API reference for all functions
- **[DATA_STRUCTURES.md](./DATA_STRUCTURES.md)** - Detailed struct and enum documentation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Build, test, and deploy instructions
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Frontend integration examples
- **[TESTING.md](./TESTING.md)** - Testing strategies and running tests
- **[SECURITY.md](./SECURITY.md)** - Security considerations and best practices
- **[EVENTS.md](./EVENTS.md)** - All events emitted by the contracts

## Getting Started

### Build & Test

```bash
# Build the contracts
sui move build

# Run tests
sui move test

# Deploy to localnet
sui client publish --gas-budget 500000000
```

[→ Full Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Integration Example

```typescript
// Subscribe to a publication
const txb = new TransactionBuilder();
const [coin] = txb.splitCoins(txb.gas, [5_000_000_000n]); // 5 SUI

txb.moveCall({
  target: `${packageId}::subscription::subscribe`,
  arguments: [
    txb.object(publicationId),
    txb.pure.u8(1), // Basic tier
    coin,
    txb.object('0x6'), // Clock
  ],
});
```

[→ Full Integration Guide](./INTEGRATION_GUIDE.md)

## Key Concepts

### Capability-Based Security

All privileged operations require the `PublisherCap` capability object, ensuring only the publication owner can:
- Publish articles
- Update pricing
- Access analytics

### Tier-Based Access

Three subscription tiers with hierarchical access:
- **Free** (0 SUI) - Access to free-tier articles
- **Basic** (5 SUI/month) - Access to free + basic articles
- **Premium** (15 SUI/month) - Access to all articles

### Encryption Flow

1. Author writes article in markdown
2. Frontend encrypts with Seal
3. Encrypted content uploaded to Walrus
4. Article object created on-chain with Walrus blob ID and Seal key
5. Readers with valid subscriptions request decryption keys from Seal servers
6. Seal servers call `seal_approve_*` functions to verify access

### Subscription Lifecycle

```
Create → Active → Expired → Renew
   ↓        ↓        ↓
 Place   Access   Invalid
   ↓     Content     ↓
 Kiosk      ↓     Blocked
   ↓     Views
 List       ↓
   ↓    Analytics
 Sell
```

## Design Patterns

### Package Visibility

Functions use `public(package)` for internal-only operations:
- `publication::increment_article_count()` - Only callable by article module
- `analytics::record_subscription()` - Only callable within package

### Event-Driven Architecture

All state changes emit events for off-chain indexing:
- `PublicationCreated` - New publication
- `SubscriptionCreated` - New subscriber
- `ArticlePublished` - New article
- `RevenueRecorded` - Payment received

### Shared vs Owned Objects

- **Shared**: `Publication`, `Article`, `PublicationStats` - Multiple users read
- **Owned**: `PublisherCap`, `SubscriptionNFT`, `ReadToken` - Single owner

## Support

For questions or issues:
- Review the [Integration Guide](./INTEGRATION_GUIDE.md)
- Check [Security Considerations](./SECURITY.md)
- See [Testing Guide](./TESTING.md)

## License

MIT License - See [LICENSE](../../LICENSE) file
