# Treasury Module Documentation

## Overview

The Treasury module (`private_publishing::treasury`) manages the protocol's economic system, collecting fees and deposits to sustain platform operations. It implements a transparent, on-chain treasury that tracks all revenue sources and enables administrative fund management.

**Deployed Treasury ID (Testnet):**
```
0xc97daeff8a72b4f0bed8f66c3c19779d78d6eedbfe3e58774a1495701f863a22
```

## Key Concepts

### Revenue Sources

The treasury collects funds from three primary sources:

1. **Subscription Fees** - A percentage taken from subscription payments
2. **Article Deposits** - One-time deposits required when publishing articles
3. **Pay-Per-Article Fees** - Fees from individual article purchases (if implemented)

### Basis Points System

All fees are calculated using **basis points (BPS)**:
- 1 BPS = 0.01%
- 100 BPS = 1.00%
- 1000 BPS = 10.00%
- Maximum allowed rate: 1000 BPS (10%)

Default rates:
- Subscription fee: **100 BPS (1%)**
- Article deposit: **100 BPS (1% of premium tier price)**

## Treasury Structure

### Core Object

```move
public struct Treasury has key {
    id: UID,
    balance: Balance<SUI>,
    subscription_fee_bps: u64,      // Default: 100 (1%)
    article_deposit_bps: u64,       // Default: 100 (1%)
    total_fees_collected: u64,      // Cumulative subscription/PPV fees
    total_deposits_collected: u64,  // Cumulative article deposits
}
```

### Admin Capability

```move
public struct TreasuryCap has key, store {
    id: UID,
}
```

The `TreasuryCap` is issued to the package deployer and grants:
- Withdrawal privileges
- Fee rate adjustment authority
- Full treasury management rights

## Fee Mechanics

### 1. Subscription Fees

**When:** A user subscribes to a publication

**Rate:** 1% of subscription price (default)

**Flow:**
```
User Payment (1000 SUI)
  ├─> Treasury Fee: 10 SUI (1%)
  └─> Publisher Receives: 990 SUI (99%)
```

**Example Calculation:**
```
Basic Tier: 100 SUI/month
  ├─> Treasury: 1 SUI
  └─> Publisher: 99 SUI

Premium Tier: 500 SUI/month
  ├─> Treasury: 5 SUI
  └─> Publisher: 495 SUI
```

### 2. Article Publishing Deposits

**When:** A publisher creates a new article

**Rate:** 1% of the publication's premium tier price (default)

**Important:** Deposits are **non-refundable** and go entirely to the treasury.

**Flow:**
```
Article Creation
  ├─> Publisher pays deposit: premium_price * 1%
  ├─> Deposit goes to treasury (non-refundable)
  └─> Article is published
```

**Example Calculation:**
```
Publication Premium Price: 500 SUI/month
Required Article Deposit: 5 SUI (1% of 500)

Publication Premium Price: 1000 SUI/month
Required Article Deposit: 10 SUI (1% of 1000)

Free Publication (Premium = 0)
Required Article Deposit: 0 SUI (1% of 0)
```

**Design Rationale:**
- Prevents spam/low-quality content
- Ties deposit to premium price (higher-value publications pay more)
- Creates sustainability for encrypted storage costs
- Free publications have no deposit requirement

### 3. Pay-Per-Article Fees

**When:** A reader purchases a single article (without subscription)

**Rate:** 1% of article price (default)

**Flow:**
```
Article Purchase (100 SUI)
  ├─> Treasury Fee: 1 SUI (1%)
  └─> Publisher Receives: 99 SUI (99%)
```

## API Reference

### Fee Collection Functions

#### `collect_subscription_fee`

Deducts subscription fee from payment and adds it to treasury.

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
- `treasury` - Mutable reference to shared Treasury object
- `payment` - Coin to deduct fee from (mutated in place)
- `publication_id` - ID of publication being subscribed to
- `subscriber` - Address of subscriber (for event tracking)

**Returns:** Remaining amount after fee deduction (for publisher)

**Events:** Emits `SubscriptionFeeCollected`

**Example:**
```move
// User pays 1000 SUI for subscription
let mut payment_coin = coin::mint_for_testing<SUI>(1000);

// Treasury takes 1% = 10 SUI
let publisher_amount = treasury::collect_subscription_fee(
    &mut treasury,
    &mut payment_coin,
    publication_id,
    user_address,
    ctx
);

// publisher_amount = 990 SUI
// payment_coin now contains 990 SUI
```

#### `collect_article_deposit`

Collects entire deposit amount when article is published.

```move
public fun collect_article_deposit(
    treasury: &mut Treasury,
    deposit: Coin<SUI>,
    publication_id: ID,
    publisher: address,
)
```

**Parameters:**
- `treasury` - Mutable reference to shared Treasury object
- `deposit` - Coin containing deposit amount (consumed)
- `publication_id` - ID of publication publishing the article
- `publisher` - Address of publisher (for event tracking)

**Events:** Emits `ArticleDepositCollected`

**Important:** The deposit coin is consumed entirely. Calculate required amount first with `calculate_article_deposit()`.

**Example:**
```move
// Calculate required deposit (1% of 500 SUI premium price)
let deposit_amount = treasury::calculate_article_deposit(
    &treasury,
    500  // premium_price
);
// deposit_amount = 5 SUI

// Create deposit coin
let deposit_coin = coin::split(&mut payment, deposit_amount, ctx);

// Submit deposit (non-refundable)
treasury::collect_article_deposit(
    &mut treasury,
    deposit_coin,
    publication_id,
    publisher_address
);
```

#### `collect_pay_per_article_fee`

Deducts fee from single article purchase payment.

```move
public fun collect_pay_per_article_fee(
    treasury: &mut Treasury,
    payment: &mut Coin<SUI>,
    article_id: ID,
    reader: address,
    ctx: &mut TxContext
): u64
```

**Parameters:**
- `treasury` - Mutable reference to shared Treasury object
- `payment` - Coin to deduct fee from (mutated in place)
- `article_id` - ID of article being purchased
- `reader` - Address of reader (for event tracking)

**Returns:** Remaining amount after fee deduction (for publisher)

**Events:** Emits `PayPerArticleFeeCollected`

### Calculation Functions

#### `calculate_article_deposit`

Calculates required deposit for publishing an article.

```move
public fun calculate_article_deposit(
    treasury: &Treasury,
    premium_price: u64
): u64
```

**Parameters:**
- `treasury` - Reference to Treasury object
- `premium_price` - Premium tier monthly subscription price

**Returns:** Required deposit amount in SUI

**Formula:** `deposit = (premium_price * article_deposit_bps) / 10000`

**Examples:**
```move
// Premium price: 500 SUI, Rate: 100 BPS (1%)
calculate_article_deposit(&treasury, 500) → 5 SUI

// Premium price: 1000 SUI, Rate: 100 BPS (1%)
calculate_article_deposit(&treasury, 1000) → 10 SUI

// Free publication: Premium price: 0 SUI
calculate_article_deposit(&treasury, 0) → 0 SUI

// Premium price: 50 SUI, Rate: 100 BPS (1%)
calculate_article_deposit(&treasury, 50) → 0 SUI (rounds down)
```

#### `split_payment_with_fee`

Helper function to split a payment into fee and remainder.

```move
public fun split_payment_with_fee(
    payment: Coin<SUI>,
    fee_bps: u64,
    ctx: &mut TxContext
): (Coin<SUI>, Coin<SUI>)
```

**Parameters:**
- `payment` - Original payment coin
- `fee_bps` - Fee rate in basis points
- `ctx` - Transaction context

**Returns:** Tuple of (fee_coin, remainder_coin)

### Admin Functions

#### `withdraw`

Withdraws funds from treasury (admin only).

```move
public fun withdraw(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext
)
```

**Parameters:**
- `treasury` - Mutable reference to shared Treasury object
- `_cap` - TreasuryCap proving admin authority
- `amount` - Amount to withdraw in SUI
- `recipient` - Address to receive withdrawn funds

**Events:** Emits `TreasuryWithdrawal`

**Errors:**
- `EInsufficientBalance` - Treasury balance is less than requested amount

**Example:**
```move
// Admin withdraws 1000 SUI to their address
treasury::withdraw(
    &mut treasury,
    &treasury_cap,
    1000,
    admin_address,
    ctx
);
```

#### `update_fee_rates`

Updates protocol fee rates (admin only).

```move
public fun update_fee_rates(
    treasury: &mut Treasury,
    _cap: &TreasuryCap,
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
)
```

**Parameters:**
- `treasury` - Mutable reference to shared Treasury object
- `_cap` - TreasuryCap proving admin authority
- `new_subscription_fee_bps` - New subscription fee rate (0-1000 BPS)
- `new_article_deposit_bps` - New article deposit rate (0-1000 BPS)

**Events:** Emits `FeeRatesUpdated`

**Errors:**
- `EInvalidFeeRate` - Rate exceeds maximum (1000 BPS = 10%)

**Example:**
```move
// Reduce fees to 0.5%
treasury::update_fee_rates(
    &mut treasury,
    &treasury_cap,
    50,  // 0.5% subscription fee
    50   // 0.5% article deposit
);
```

### Query Functions

```move
public fun balance(treasury: &Treasury): u64
public fun subscription_fee_bps(treasury: &Treasury): u64
public fun article_deposit_bps(treasury: &Treasury): u64
public fun total_fees_collected(treasury: &Treasury): u64
public fun total_deposits_collected(treasury: &Treasury): u64
```

**Usage:**
```move
// Get current treasury balance
let treasury_balance = treasury::balance(&treasury);

// Get current fee rates
let sub_fee = treasury::subscription_fee_bps(&treasury);  // 100 (1%)
let deposit_rate = treasury::article_deposit_bps(&treasury);  // 100 (1%)

// Get total revenue
let fees = treasury::total_fees_collected(&treasury);
let deposits = treasury::total_deposits_collected(&treasury);
let total_revenue = fees + deposits;
```

## Events

### `TreasuryCreated`

Emitted when treasury is initialized during package deployment.

```move
public struct TreasuryCreated has copy, drop {
    treasury_id: ID,
    admin: address,
}
```

### `SubscriptionFeeCollected`

Emitted when subscription fee is collected.

```move
public struct SubscriptionFeeCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    subscriber: address,
}
```

### `ArticleDepositCollected`

Emitted when article publishing deposit is collected.

```move
public struct ArticleDepositCollected has copy, drop {
    amount: u64,
    publication_id: ID,
    publisher: address,
}
```

### `PayPerArticleFeeCollected`

Emitted when pay-per-article fee is collected.

```move
public struct PayPerArticleFeeCollected has copy, drop {
    amount: u64,
    article_id: ID,
    reader: address,
}
```

### `TreasuryWithdrawal`

Emitted when admin withdraws funds.

```move
public struct TreasuryWithdrawal has copy, drop {
    amount: u64,
    recipient: address,
}
```

### `FeeRatesUpdated`

Emitted when admin updates fee rates.

```move
public struct FeeRatesUpdated has copy, drop {
    new_subscription_fee_bps: u64,
    new_article_deposit_bps: u64,
}
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `EInsufficientBalance` | Treasury balance is insufficient for withdrawal |
| 2 | `EInvalidFeeRate` | Fee rate exceeds maximum allowed (10%) |
| 3 | `EZeroAmount` | Attempted deposit with zero amount |

## Cost Calculator

### For Publishers

#### Subscription Revenue (per subscriber)

```
Basic Tier Example: 100 SUI/month
├─> Subscriber pays: 100 SUI
├─> Treasury fee (1%): 1 SUI
└─> Publisher receives: 99 SUI

Premium Tier Example: 500 SUI/month
├─> Subscriber pays: 500 SUI
├─> Treasury fee (1%): 5 SUI
└─> Publisher receives: 495 SUI
```

#### Article Publishing Costs

```
Publication with 500 SUI Premium Tier:
├─> Per article deposit: 5 SUI (1% of 500)
├─> Deposit is non-refundable
└─> Paid once per article

Publication with 1000 SUI Premium Tier:
├─> Per article deposit: 10 SUI (1% of 1000)

Free Publication (Premium = 0):
├─> Per article deposit: 0 SUI
└─> No cost to publish articles
```

#### Monthly P&L Example

Scenario: Premium Publication (500 SUI/month tier), 100 subscribers, 10 articles

**Revenue:**
```
100 subscribers × 495 SUI (after 1% fee) = 49,500 SUI
```

**Costs:**
```
10 articles × 5 SUI deposit = 50 SUI
```

**Net Monthly Income:**
```
49,500 - 50 = 49,450 SUI
```

**Effective Fee Rate:**
```
(50 + 500) / 50,000 = 1.1% total
```

### For Readers

```
Premium Subscription: 500 SUI/month
├─> Total cost: 500 SUI
├─> Unlimited article access
└─> No additional fees

Pay-Per-Article: 50 SUI/article
├─> Article price: 50 SUI
├─> Treasury fee (1%): 0.5 SUI (rounds down to 0)
└─> Total cost: 50 SUI
```

## Integration Guide

### Publishing an Article

```typescript
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../networkConfig';

function usePublishArticle() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable('packageId');
  const treasuryId = useNetworkVariable('treasuryId');

  async function publishArticle(
    publicationId: string,
    premiumPrice: number,
    encryptedBlobId: string,
    title: string
  ) {
    // 1. Calculate required deposit
    const treasury = await client.getObject({
      id: treasuryId,
      options: { showContent: true }
    });

    const depositRate = (treasury.data.content as any).fields.article_deposit_bps;
    const depositAmount = Math.floor((premiumPrice * depositRate) / 10000);

    // 2. Create transaction
    const tx = new Transaction();

    // Split deposit from payment source
    const [depositCoin] = tx.splitCoins(tx.gas, [depositAmount]);

    // 3. Publish article with deposit
    tx.moveCall({
      target: `${packageId}::article::create`,
      arguments: [
        tx.object(publicationId),
        tx.object(treasuryId),
        depositCoin,
        tx.pure.string(encryptedBlobId),
        tx.pure.string(title),
        // ... other article metadata
      ],
    });

    // 4. Execute transaction
    await client.signAndExecuteTransaction({
      transaction: tx,
      sender: account!.address,
    });
  }

  return { publishArticle };
}
```

### Processing a Subscription

```typescript
async function subscribe(
  publicationId: string,
  tier: 'FREE' | 'BASIC' | 'PREMIUM',
  price: number
) {
  const tx = new Transaction();

  // 1. Create payment coin
  const [paymentCoin] = tx.splitCoins(tx.gas, [price]);

  // 2. Subscribe (treasury fee is deducted internally)
  tx.moveCall({
    target: `${packageId}::subscription::subscribe`,
    arguments: [
      tx.object(publicationId),
      tx.object(treasuryId),
      paymentCoin,
      tx.pure.u8(tierToEnum(tier)),
      // ... other args
    ],
  });

  await client.signAndExecuteTransaction({
    transaction: tx,
    sender: account!.address,
  });
}
```

### Querying Treasury Stats

```typescript
async function getTreasuryStats() {
  const treasury = await client.getObject({
    id: treasuryId,
    options: { showContent: true }
  });

  const content = (treasury.data.content as any).fields;

  return {
    balance: Number(content.balance),
    subscriptionFeeBps: content.subscription_fee_bps,
    articleDepositBps: content.article_deposit_bps,
    totalFeesCollected: Number(content.total_fees_collected),
    totalDepositsCollected: Number(content.total_deposits_collected),
    totalRevenue: Number(content.total_fees_collected) + Number(content.total_deposits_collected),
  };
}
```

## Admin Operations

### Withdrawing Funds

```bash
# Using Sui CLI
sui client call \
  --package $PACKAGE_ID \
  --module treasury \
  --function withdraw \
  --args \
    $TREASURY_ID \
    $TREASURY_CAP_ID \
    1000000000 \
    $RECIPIENT_ADDRESS \
  --gas-budget 10000000
```

### Updating Fee Rates

```bash
# Reduce fees to 0.5%
sui client call \
  --package $PACKAGE_ID \
  --module treasury \
  --function update_fee_rates \
  --args \
    $TREASURY_ID \
    $TREASURY_CAP_ID \
    50 \
    50 \
  --gas-budget 10000000
```

## Best Practices

### For Publishers

1. **Calculate deposits before publishing**
   - Use `calculate_article_deposit()` to get exact amount
   - Ensure sufficient balance before article creation
   - Consider deposit cost when setting premium prices

2. **Set strategic premium prices**
   - Higher premium price = higher article deposit
   - Balance subscriber affordability vs deposit cost
   - Free publications have zero deposit requirement

3. **Budget for article deposits**
   - Deposits are non-refundable
   - Plan content calendar with deposit costs in mind
   - Account for 1% deposit in ROI calculations

### For Platform Administrators

1. **Monitor treasury balance**
   - Ensure sufficient funds for operations
   - Regular withdrawals for operational expenses
   - Track fee vs deposit revenue sources

2. **Fee rate adjustments**
   - Current 1% rate is sustainable and fair
   - Changes affect new transactions only
   - Communicate rate changes to community

3. **Transparency**
   - All transactions are on-chain and auditable
   - Events provide complete fee tracking
   - Consider publishing treasury stats dashboard

## Frequently Asked Questions

### Why are article deposits required?

Article deposits serve multiple purposes:
1. **Spam prevention** - Prevents low-quality/spam content
2. **Storage costs** - Helps cover Walrus encrypted storage
3. **Quality signal** - Publishers invest in their content
4. **Sustainability** - Ensures long-term platform viability

### Are deposits refundable?

No. Article deposits are non-refundable and go entirely to the treasury. This is by design to prevent abuse and ensure committed content creation.

### Why is the deposit based on premium price?

Higher-value publications (with higher premium prices) are expected to:
- Attract more readers
- Generate more storage/bandwidth costs
- Have higher quality content
- Support platform sustainability proportionally

### Can I publish without paying a deposit?

Yes, if your publication has a **premium tier price of 0 SUI** (free publication), the article deposit is also 0 SUI.

### How is the 1% fee calculated?

Using integer math with basis points:
```
fee_amount = (payment_amount * fee_bps) / 10000

Example: 100 SUI × 100 BPS / 10000 = 1 SUI (1%)
```

Note: Integer division means very small amounts may round down to 0.

### What happens to treasury funds?

Treasury funds are used for:
- Platform development and maintenance
- Infrastructure costs (RPC nodes, indexers)
- Security audits and bug bounties
- Community incentives and grants
- Emergency reserves

### Can fee rates change?

Yes, the admin (TreasuryCap holder) can update rates, but:
- Maximum rate: 10% (1000 BPS)
- Changes are transparent (on-chain events)
- Community governance may be added later

### How do I track my fees paid?

Monitor these events:
- `SubscriptionFeeCollected` - Fees from subscriptions
- `ArticleDepositCollected` - Your article deposits
- Query on-chain using the publication/article IDs

## Technical Notes

### Integer Math Precision

Fees use integer division, which may cause rounding:

```
Amount: 99 SUI, Rate: 1% (100 BPS)
Calculation: (99 * 100) / 10000 = 0.99 → rounds to 0 SUI

Amount: 100 SUI, Rate: 1% (100 BPS)
Calculation: (100 * 100) / 10000 = 1 SUI ✓
```

For small amounts (<100 SUI at 1%), fees may round to zero.

### Shared Object Considerations

The Treasury is a **shared object**, which means:
- Multiple transactions can access it concurrently
- No consensus delays for parallel subscriptions
- Events provide complete audit trail
- Balance updates are atomic

### Security Design

- **Admin capability pattern**: Only TreasuryCap holder can withdraw/update
- **Non-refundable deposits**: Prevents deposit/refund cycling attacks
- **Maximum fee cap**: Hard limit at 10% prevents excessive fees
- **Event emissions**: Full transparency for all operations

## Source Code Reference

Treasury module: `move/sources/treasury.move`

Key functions:
- `collect_subscription_fee` - treasury.move:98
- `collect_article_deposit` - treasury.move:133
- `calculate_article_deposit` - treasury.move:235
- `withdraw` - treasury.move:191
- `update_fee_rates` - treasury.move:214

## See Also

- [API and Contracts Documentation](./API_AND_CONTRACTS.md) - Complete API reference
- [User Guide](./USER_GUIDE.md) - User-facing cost information
- [Architecture Documentation](./ARCHITECTURE.md) - System design
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Treasury deployment steps
