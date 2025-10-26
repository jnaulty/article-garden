# Events Reference

Complete reference for all events emitted by the private publishing smart contracts.

## Table of Contents

- [publication Events](#publication-events)
- [article Events](#article-events)
- [subscription Events](#subscription-events)
- [access_control Events](#access_control-events)
- [analytics Events](#analytics-events)
- [treasury Events](#treasury-events)
- [Event Monitoring](#event-monitoring)

---

## publication Events

### `PublicationCreated`

Emitted when a new publication is created.

```move
public struct PublicationCreated has copy, drop {
    publication_id: ID,
    creator: address,
    name: String,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `publication_id` | `ID` | Unique publication identifier |
| `creator` | `address` | Creator's address |
| `name` | `String` | Publication name |

**When Emitted:**
- `publication::create_publication()` succeeds

**Use Cases:**
- Index new publications
- Display recent publications
- Track publication count
- Notify followers

**Example Event Data:**
```json
{
  "type": "0xabc::publication::PublicationCreated",
  "publication_id": "0x123...",
  "creator": "0x456...",
  "name": "Tech Weekly"
}
```

### `PricingUpdated`

Emitted when publication pricing is changed.

```move
public struct PricingUpdated has copy, drop {
    publication_id: ID,
    basic_price: u64,
    premium_price: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `publication_id` | `ID` | Publication being updated |
| `basic_price` | `u64` | New basic tier price (MIST) |
| `premium_price` | `u64` | New premium tier price (MIST) |

**When Emitted:**
- `publication::update_pricing()` succeeds

**Use Cases:**
- Alert subscribers to price changes
- Track pricing history
- Market analysis
- Subscription renewal notifications

**Example Event Data:**
```json
{
  "type": "0xabc::publication::PricingUpdated",
  "publication_id": "0x123...",
  "basic_price": "5000000000",
  "premium_price": "15000000000"
}
```

### `FreeTierToggled`

Emitted when free tier is enabled/disabled.

```move
public struct FreeTierToggled has copy, drop {
    publication_id: ID,
    enabled: bool,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `publication_id` | `ID` | Publication being updated |
| `enabled` | `bool` | True if enabled, false if disabled |

**When Emitted:**
- `publication::toggle_free_tier()` succeeds

**Use Cases:**
- Alert users to access changes
- Update subscription options
- Track publication strategy

**Example Event Data:**
```json
{
  "type": "0xabc::publication::FreeTierToggled",
  "publication_id": "0x123...",
  "enabled": true
}
```

---

## article Events

### `ArticlePublished`

Emitted when a new article is published.

```move
public struct ArticlePublished has copy, drop {
    article_id: ID,
    publication_id: ID,
    title: String,
    tier: u8,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `article_id` | `ID` | Unique article identifier |
| `publication_id` | `ID` | Parent publication |
| `title` | `String` | Article title |
| `tier` | `u8` | Required tier (0=Free, 1=Basic, 2=Premium) |

**When Emitted:**
- `article::publish_article()` succeeds

**Use Cases:**
- Notify subscribers of new content
- Update article listings
- Build content feeds
- Search indexing

**Example Event Data:**
```json
{
  "type": "0xabc::article::ArticlePublished",
  "article_id": "0x789...",
  "publication_id": "0x123...",
  "title": "Understanding Move Programming",
  "tier": 1
}
```

### `ArticleUpdated`

Emitted when article metadata is updated.

```move
public struct ArticleUpdated has copy, drop {
    article_id: ID,
    title: String,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `article_id` | `ID` | Article being updated |
| `title` | `String` | New title |

**When Emitted:**
- `article::update_article()` succeeds

**Use Cases:**
- Update cached article data
- Track content changes
- Re-index search

**Example Event Data:**
```json
{
  "type": "0xabc::article::ArticleUpdated",
  "article_id": "0x789...",
  "title": "Understanding Move Programming (Updated)"
}
```

### `ArticleArchived`

Emitted when an article is archived (hidden).

```move
public struct ArticleArchived has copy, drop {
    article_id: ID,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `article_id` | `ID` | Article being archived |

**When Emitted:**
- `article::archive_article()` succeeds

**Use Cases:**
- Hide from public listings
- Remove from search indexes
- Track content lifecycle

**Example Event Data:**
```json
{
  "type": "0xabc::article::ArticleArchived",
  "article_id": "0x789..."
}
```

---

## subscription Events

### `SubscriptionCreated`

Emitted when a new subscription is created.

```move
public struct SubscriptionCreated has copy, drop {
    subscription_id: ID,
    publication_id: ID,
    subscriber: address,
    tier: u8,
    expires_at: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `subscription_id` | `ID` | Unique subscription NFT ID |
| `publication_id` | `ID` | Publication subscribed to |
| `subscriber` | `address` | Subscriber's address |
| `tier` | `u8` | Subscription tier (0=Free, 1=Basic, 2=Premium) |
| `expires_at` | `u64` | Unix timestamp when expires (seconds) |

**When Emitted:**
- `subscription::subscribe()` succeeds

**Use Cases:**
- Track new subscribers
- Welcome emails/notifications
- Analytics dashboards
- Revenue tracking

**Example Event Data:**
```json
{
  "type": "0xabc::subscription::SubscriptionCreated",
  "subscription_id": "0xabc...",
  "publication_id": "0x123...",
  "subscriber": "0x456...",
  "tier": 1,
  "expires_at": "1735689600"
}
```

### `SubscriptionRenewed`

Emitted when a subscription is renewed.

```move
public struct SubscriptionRenewed has copy, drop {
    subscription_id: ID,
    new_expiry: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `subscription_id` | `ID` | Subscription being renewed |
| `new_expiry` | `u64` | New expiration timestamp (seconds) |

**When Emitted:**
- `subscription::renew()` succeeds

**Use Cases:**
- Track renewal rate
- Update expiry caches
- Renewal notifications
- Revenue tracking

**Example Event Data:**
```json
{
  "type": "0xabc::subscription::SubscriptionRenewed",
  "subscription_id": "0xabc...",
  "new_expiry": "1738368000"
}
```

---

## access_control Events

### `ReadTokenGenerated`

Emitted when a pay-per-article token is created.

```move
public struct ReadTokenGenerated has copy, drop {
    token_id: ID,
    article_id: ID,
    reader: address,
    expires_at: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `token_id` | `ID` | Unique token identifier |
| `article_id` | `ID` | Article being unlocked |
| `reader` | `address` | Reader's address |
| `expires_at` | `u64` | Token expiration timestamp (seconds) |

**When Emitted:**
- `access_control::generate_read_token()` succeeds

**Use Cases:**
- Track pay-per-article purchases
- Temporary access management
- Revenue attribution
- Usage analytics

**Example Event Data:**
```json
{
  "type": "0xabc::access_control::ReadTokenGenerated",
  "token_id": "0xdef...",
  "article_id": "0x789...",
  "reader": "0x456...",
  "expires_at": "1703894400"
}
```

---

## analytics Events

### `StatsCreated`

Emitted when analytics tracking is initialized.

```move
public struct StatsCreated has copy, drop {
    stats_id: ID,
    publication_id: ID,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `stats_id` | `ID` | Unique stats object ID |
| `publication_id` | `ID` | Publication being tracked |

**When Emitted:**
- `analytics::create_stats()` succeeds

**Use Cases:**
- Track analytics initialization
- Link stats to publications
- Setup monitoring

**Example Event Data:**
```json
{
  "type": "0xabc::analytics::StatsCreated",
  "stats_id": "0xghi...",
  "publication_id": "0x123..."
}
```

### `SubscriptionRecorded`

Emitted when a new subscription is recorded in analytics.

```move
public struct SubscriptionRecorded has copy, drop {
    publication_id: ID,
    tier: u8,
    total_subscribers: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `publication_id` | `ID` | Publication gaining subscriber |
| `tier` | `u8` | Tier of new subscriber |
| `total_subscribers` | `u64` | New total subscriber count |

**When Emitted:**
- `analytics::record_subscription()` succeeds

**Use Cases:**
- Growth tracking
- Milestone notifications
- Dashboard updates
- Creator analytics

**Example Event Data:**
```json
{
  "type": "0xabc::analytics::SubscriptionRecorded",
  "publication_id": "0x123...",
  "tier": 1,
  "total_subscribers": "42"
}
```

### `RevenueRecorded`

Emitted when revenue is tracked.

```move
public struct RevenueRecorded has copy, drop {
    publication_id: ID,
    amount: u64,
    total_revenue: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `publication_id` | `ID` | Publication earning revenue |
| `amount` | `u64` | Amount earned in this transaction (MIST) |
| `total_revenue` | `u64` | Cumulative total revenue (MIST) |

**When Emitted:**
- `analytics::record_revenue()` succeeds

**Use Cases:**
- Financial tracking
- Tax reporting
- Revenue analytics
- Milestone notifications

**Example Event Data:**
```json
{
  "type": "0xabc::analytics::RevenueRecorded",
  "publication_id": "0x123...",
  "amount": "5000000000",
  "total_revenue": "50000000000"
}
```

---

## treasury Events

### `TreasuryCreated`

Emitted when the treasury is initialized during deployment.

```move
public struct TreasuryCreated has copy, drop {
    treasury_id: ID,
    admin: address,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `treasury_id` | `ID` | Unique treasury object ID |
| `admin` | `address` | Initial admin address (deployer) |

**When Emitted:**
- Module `init()` function during deployment

**Use Cases:**
- Record treasury deployment
- Track admin changes
- Setup monitoring

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::TreasuryCreated",
  "treasury_id": "0x123...",
  "admin": "0x456..."
}
```

### `SubscriptionFeeCollected`

Emitted when a subscription fee is collected.

```move
public struct SubscriptionFeeCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    subscriber: address,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `u64` | Fee amount collected (MIST) |
| `publication_id` | `ID` | Publication being subscribed to |
| `subscriber` | `address` | Subscriber address |

**When Emitted:**
- `treasury::collect_subscription_fee()` succeeds

**Use Cases:**
- Track protocol revenue
- Monitor fee collection
- Analytics and reporting
- Tax compliance

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::SubscriptionFeeCollected",
  "amount": "50000000",
  "publication_id": "0x123...",
  "subscriber": "0x456..."
}
```

### `ArticleDepositCollected`

Emitted when an article publishing deposit is collected.

```move
public struct ArticleDepositCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    publisher: address,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `u64` | Deposit amount collected (MIST) |
| `publication_id` | `ID` | Publication publishing the article |
| `publisher` | `address` | Publisher address |

**When Emitted:**
- `treasury::collect_article_deposit()` succeeds

**Use Cases:**
- Track article publishing activity
- Monitor deposit revenue
- Publisher analytics
- Spam prevention metrics

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::ArticleDepositCollected",
  "amount": "150000000",
  "publication_id": "0x123...",
  "publisher": "0x456..."
}
```

### `PayPerArticleFeeCollected`

Emitted when a pay-per-article fee is collected.

```move
public struct PayPerArticleFeeCollected has copy, drop {
    amount: u64,
    article_id: ID,
    reader: address,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `u64` | Fee amount collected (MIST) |
| `article_id` | `ID` | Article being purchased |
| `reader` | `address` | Reader address |

**When Emitted:**
- `treasury::collect_pay_per_article_fee()` succeeds

**Use Cases:**
- Track pay-per-article revenue
- Monitor non-subscription purchases
- Reader behavior analytics
- Alternative monetization tracking

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::PayPerArticleFeeCollected",
  "amount": "1666667",
  "article_id": "0x789...",
  "reader": "0x456..."
}
```

### `TreasuryWithdrawal`

Emitted when funds are withdrawn from treasury.

```move
public struct TreasuryWithdrawal has copy, drop {
    amount: u64,
    recipient: address,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `amount` | `u64` | Amount withdrawn (MIST) |
| `recipient` | `address` | Recipient address |

**When Emitted:**
- `treasury::withdraw()` succeeds

**Use Cases:**
- Audit trail for fund movements
- Financial tracking
- Admin activity monitoring
- Transparency reporting

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::TreasuryWithdrawal",
  "amount": "100000000000",
  "recipient": "0xadmin..."
}
```

### `FeeRatesUpdated`

Emitted when treasury fee rates are changed.

```move
public struct FeeRatesUpdated has copy, drop {
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `new_subscription_fee_bps` | `u64` | New subscription fee in basis points |
| `new_article_deposit_bps` | `u64` | New article deposit in basis points |

**When Emitted:**
- `treasury::update_fee_rates()` succeeds

**Use Cases:**
- Track fee policy changes
- Notify stakeholders
- Historical fee tracking
- Governance transparency

**Example Event Data:**
```json
{
  "type": "0xabc::treasury::FeeRatesUpdated",
  "new_subscription_fee_bps": "200",
  "new_article_deposit_bps": "200"
}
```

---

## Event Monitoring

### Subscribing to Events

Using Sui TypeScript SDK:

```typescript
import { SuiClient } from '@mysten/sui/client';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

// Subscribe to all publication events
const unsubscribe = await client.subscribeEvent({
  filter: {
    MoveEventModule: {
      package: PACKAGE_ID,
      module: 'publication',
    },
  },
  onMessage: (event) => {
    console.log('Publication event:', event);

    // Parse event type
    if (event.type.endsWith('::PublicationCreated')) {
      handlePublicationCreated(event);
    } else if (event.type.endsWith('::PricingUpdated')) {
      handlePricingUpdated(event);
    }
  },
});

// Unsubscribe when done
unsubscribe();
```

### Filtering Events

```typescript
// Filter by event type
client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionCreated`,
  },
  onMessage: handleNewSubscription,
});

// Filter by sender
client.subscribeEvent({
  filter: {
    Sender: creatorAddress,
  },
  onMessage: handleCreatorEvent,
});
```

### Querying Historical Events

```typescript
// Get recent publication events
const events = await client.queryEvents({
  query: {
    MoveEventModule: {
      package: PACKAGE_ID,
      module: 'publication',
    },
  },
  limit: 50,
  order: 'descending',
});

// Process events
for (const event of events.data) {
  console.log('Event:', event.parsedJson);
}

// Paginate through events
let cursor = events.nextCursor;
while (cursor) {
  const nextPage = await client.queryEvents({
    query: { MoveEventModule: { package: PACKAGE_ID, module: 'article' } },
    cursor,
  });

  // Process nextPage.data
  cursor = nextPage.nextCursor;
}
```

### Building Event Indexer

```typescript
interface EventHandler {
  [eventType: string]: (event: any) => void;
}

const handlers: EventHandler = {
  PublicationCreated: async (event) => {
    await db.publications.insert({
      id: event.publication_id,
      creator: event.creator,
      name: event.name,
      created_at: new Date(),
    });
  },

  SubscriptionCreated: async (event) => {
    await db.subscriptions.insert({
      id: event.subscription_id,
      publication_id: event.publication_id,
      subscriber: event.subscriber,
      tier: event.tier,
      expires_at: new Date(event.expires_at * 1000),
    });
  },

  ArticlePublished: async (event) => {
    await db.articles.insert({
      id: event.article_id,
      publication_id: event.publication_id,
      title: event.title,
      tier: event.tier,
    });

    // Notify subscribers
    await notifySubscribers(event.publication_id, event.article_id);
  },
};

// Event listener
client.subscribeEvent({
  filter: {
    MoveEventModule: {
      package: PACKAGE_ID,
      module: 'publication',
    },
  },
  onMessage: (event) => {
    const eventName = event.type.split('::').pop();
    const handler = handlers[eventName];

    if (handler) {
      handler(event.parsedJson);
    }
  },
});
```

### Analytics Dashboard

```typescript
// Track publication growth
const publicationEvents = await client.queryEvents({
  query: {
    MoveEventType: `${PACKAGE_ID}::publication::PublicationCreated`,
  },
  order: 'ascending',
});

// Count by day
const byDay = publicationEvents.data.reduce((acc, event) => {
  const date = new Date(event.timestampMs).toDateString();
  acc[date] = (acc[date] || 0) + 1;
  return acc;
}, {});

// Track revenue
const revenueEvents = await client.queryEvents({
  query: {
    MoveEventType: `${PACKAGE_ID}::analytics::RevenueRecorded`,
  },
});

const totalRevenue = revenueEvents.data.reduce(
  (sum, event) => sum + BigInt(event.parsedJson.amount),
  0n
);
```

---

## Event-Driven Workflows

### Auto-Notification System

```typescript
// Notify subscribers of new articles
client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::article::ArticlePublished`,
  },
  onMessage: async (event) => {
    const { publication_id, title, tier } = event.parsedJson;

    // Get subscribers
    const subscribers = await getSubscribers(publication_id, tier);

    // Send notifications
    for (const subscriber of subscribers) {
      await sendNotification(subscriber.email, {
        subject: `New Article: ${title}`,
        body: `A new article has been published...`,
      });
    }
  },
});
```

### Revenue Tracking

```typescript
// Track creator earnings
client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::analytics::RevenueRecorded`,
  },
  onMessage: async (event) => {
    const { publication_id, amount, total_revenue } = event.parsedJson;

    // Update creator dashboard
    await updateDashboard(publication_id, {
      lastPayment: amount,
      totalEarnings: total_revenue,
    });

    // Check milestones
    if (total_revenue >= 100_000_000_000n) {
      // 100 SUI milestone
      await sendMilestoneEmail(publication_id, '100 SUI earned!');
    }
  },
});
```

---

## See Also

- [Module API](./MODULE_API.md) - Functions that emit events
- [Integration Guide](./INTEGRATION_GUIDE.md) - Event handling examples
- [Data Structures](./DATA_STRUCTURES.md) - Event field types
- [Security Guide](./SECURITY.md) - Event-based audit trails
