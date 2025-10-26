# Kiosk Integration Documentation

## Overview

Subscription NFTs in the Private Publishing Platform are **tradeable digital assets** that can be bought, sold, and transferred using the [Sui Kiosk](https://docs.sui.io/standards/kiosk) standard. This enables a secondary marketplace where users can trade subscription access, creating liquidity and new economic opportunities.

## Why Subscriptions are NFTs

### Design Philosophy

Unlike traditional web2 subscriptions that are non-transferable database entries, our subscriptions are **first-class digital assets** with the `has key, store` abilities:

```move
public struct SubscriptionNFT has key, store {
    id: UID,
    publication_id: ID,
    tier: Tier,               // Free, Basic, or Premium
    subscribed_at: u64,
    expires_at: u64,          // 30 days from subscription/renewal
    subscriber: address,
}
```

### Key Benefits

1. **True Ownership** - Users fully own their subscriptions, not just "access rights"
2. **Transferable** - Can be gifted, sold, or traded without platform permission
3. **Composable** - Works with any Sui Kiosk, wallet, or marketplace
4. **Liquid Market** - Creates price discovery for access to valuable publications
5. **Collateralizable** - Can potentially be used in DeFi protocols (future)

## Use Cases

### For Subscribers

- **Resell unused time** - Bought annual access but moving on? Sell it!
- **Gift subscriptions** - Give Premium access as a gift
- **Speculate on value** - Buy access to growing publications early, sell when popular
- **Emergency liquidity** - Convert subscription to SUI if needed

### For Publishers

- **Price discovery** - Secondary market reveals true demand
- **Viral growth** - Easy gifting increases distribution
- **Premium positioning** - High resale prices signal quality
- **Royalty income** - Earn percentage on every resale

### Real-World Scenarios

**Scenario 1: Early Adopter Profit**
```
1. Alice subscribes to "Crypto Insights" Premium for 100 SUI
2. Publication becomes extremely popular
3. 15 days later, Bob wants access but prices increased to 500 SUI
4. Alice sells her subscription (15 days remaining) for 300 SUI
5. Alice profit: 200 SUI, Bob saves: 200 SUI, Publisher earns: 30 SUI royalty
```

**Scenario 2: Gifting**
```
1. Charlie buys Basic subscription for 50 SUI as a birthday gift
2. Places it in Kiosk and transfers ownership to friend Dave
3. Dave receives full Basic access without payment
```

**Scenario 3: Churned User Liquidity**
```
1. Eve subscribes Premium for 500 SUI/month
2. After 10 days, loses interest
3. Lists subscription in Kiosk for 350 SUI (20 days remaining)
4. Frank buys it, getting discounted access
5. Eve recovers 70% of cost instead of 0%
```

## Kiosk System Overview

### What is a Sui Kiosk?

A **Kiosk** is a shared object that acts as:
- A secure storefront for digital assets
- A trading venue with enforced policies
- A royalty collection mechanism

Every Kiosk has an owner (via `KioskOwnerCap`) who can:
- Place items for storage
- List items for sale
- Take items back
- Withdraw earnings

### Transfer Policies

Our marketplace uses `TransferPolicy` to enforce:
- **Royalties** - Publishers earn on secondary sales
- **Rules** - Custom trading restrictions (if needed)
- **Transparency** - All trades are on-chain

## Subscription Lifecycle in Kiosk

### Step 1: Subscribe

```move
// User subscribes and receives NFT directly (not in Kiosk)
let subscription_nft = subscription::subscribe(
    publication,
    treasury,
    Tier::Premium,
    payment,
    clock,
    ctx
);

// NFT is owned by subscriber (ctx.sender())
transfer::public_transfer(subscription_nft, ctx.sender());
```

**Result:** SubscriptionNFT owned by user, can be used immediately.

### Step 2: Place in Kiosk (Optional)

```move
// User places subscription in their Kiosk for trading
subscription::place_in_kiosk(
    kiosk,          // User's Kiosk
    kiosk_cap,      // User's KioskOwnerCap
    subscription_nft
);
```

**Result:** NFT is now in Kiosk, can be listed for sale.

### Step 3: List for Sale

```move
// List subscription for 300 SUI
subscription::list_for_sale(
    kiosk,
    kiosk_cap,
    subscription_id,
    300_000_000_000  // 300 SUI in MIST
);
```

**Result:** NFT is publicly listed, anyone can purchase.

### Step 4: Purchase (By Buyer)

```typescript
// TypeScript SDK example
const tx = new Transaction();

// Purchase from Kiosk
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [
    tx.object(sellerKioskId),
    tx.object(subscriptionId),
    tx.splitCoins(tx.gas, [price])
  ],
  typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
});

// Pay royalty (required by transfer policy)
tx.moveCall({
  target: `${packageId}::marketplace_policies::pay_royalty`,
  arguments: [
    tx.object(transferPolicyId),
    transferRequest,
    tx.splitCoins(tx.gas, [royaltyAmount])
  ]
});

// Complete the transfer request
tx.moveCall({
  target: '0x2::transfer_policy::confirm_request',
  arguments: [tx.object(transferPolicyId), transferRequest],
  typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
});

// Transfer NFT to buyer
tx.transferObjects([nft], buyerAddress);
```

**Result:** Buyer receives NFT, seller gets SUI, publisher gets royalty.

### Step 5: Use Subscription

```move
// Buyer can now use subscription to read articles
let has_access = subscription::has_tier_access(
    &subscription_nft,
    Tier::Premium,
    clock
);
```

**Result:** Buyer has full subscription access until expiry.

## API Reference

### Kiosk Integration Functions

#### `place_in_kiosk`

Places subscription NFT into a Kiosk for trading.

```move
public fun place_in_kiosk(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription: SubscriptionNFT,
)
```

**Usage:**
```move
// After subscribing
let nft = subscription::subscribe(...);

// Place in user's Kiosk
subscription::place_in_kiosk(&mut my_kiosk, &my_kiosk_cap, nft);
```

#### `take_from_kiosk`

Removes subscription NFT from Kiosk (owner only).

```move
public fun take_from_kiosk(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription_id: ID,
): SubscriptionNFT
```

**Usage:**
```move
// Take back to use directly or gift
let nft = subscription::take_from_kiosk(
    &mut my_kiosk,
    &my_kiosk_cap,
    subscription_id
);

// Can now transfer directly or place in different Kiosk
transfer::public_transfer(nft, recipient);
```

#### `list_for_sale`

Lists subscription in Kiosk marketplace at specified price.

```move
public fun list_for_sale(
    kiosk: &mut Kiosk,
    cap: &KioskOwnerCap,
    subscription_id: ID,
    price: u64,  // Price in MIST (1 SUI = 1,000,000,000 MIST)
)
```

**Usage:**
```move
// List Premium subscription for 300 SUI
subscription::list_for_sale(
    &mut my_kiosk,
    &my_kiosk_cap,
    subscription_id,
    300_000_000_000  // 300 SUI
);
```

**Note:** Once listed, anyone can purchase at the specified price.

### Marketplace Policy Functions

#### `add_royalty_rule`

Publisher adds royalty enforcement to their publication's transfer policy.

```move
public fun add_royalty_rule(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount_bp: u16,     // Royalty in basis points (1000 = 10%)
    min_amount: u64     // Minimum royalty in MIST
)
```

**Parameters:**
- `amount_bp` - Royalty percentage (default: 1000 = 10%, max: 10000 = 100%)
- `min_amount` - Minimum absolute royalty (useful for low-price sales)

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

#### `calculate_royalty_amount`

Calculates royalty owed on a sale.

```move
public fun calculate_royalty_amount(
    policy: &TransferPolicy<SubscriptionNFT>,
    sale_price: u64
): u64
```

**Logic:**
```
royalty = max(
    sale_price * royalty_bp / 10000,
    min_amount
)
```

**Examples:**
```
Sale: 300 SUI, Royalty: 10%, Min: 1 SUI
→ max(30 SUI, 1 SUI) = 30 SUI

Sale: 5 SUI, Royalty: 10%, Min: 1 SUI
→ max(0.5 SUI, 1 SUI) = 1 SUI
```

#### `pay_royalty`

Buyer pays royalty during purchase (required).

```move
public fun pay_royalty(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    request: &mut TransferRequest<SubscriptionNFT>,
    payment: Coin<SUI>
)
```

**Usage in purchase flow:**
```move
// 1. Purchase from Kiosk (creates TransferRequest)
let (nft, mut request) = kiosk::purchase<SubscriptionNFT>(
    seller_kiosk,
    subscription_id,
    payment_coin
);

// 2. Calculate and pay royalty
let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
let royalty_coin = coin::split(&mut payment_source, royalty, ctx);
marketplace_policies::pay_royalty(&mut policy, &mut request, royalty_coin);

// 3. Confirm transfer (TransferRequest is consumed)
transfer_policy::confirm_request(&policy, request);

// 4. Receive NFT
transfer::public_transfer(nft, buyer_address);
```

#### `withdraw_royalties`

Publisher withdraws accumulated royalties.

```move
public fun withdraw_royalties(
    policy: &mut TransferPolicy<SubscriptionNFT>,
    cap: &TransferPolicyCap<SubscriptionNFT>,
    amount: Option<u64>,  // None = withdraw all
    ctx: &mut TxContext
): Coin<SUI>
```

**Usage:**
```move
// Withdraw all royalties
let earnings = marketplace_policies::withdraw_royalties(
    &mut policy,
    &policy_cap,
    option::none(),
    ctx
);

transfer::public_transfer(earnings, publisher_address);
```

## TypeScript Integration

### Creating a Kiosk

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';

async function createKiosk() {
  const tx = new Transaction();

  // Create new Kiosk
  tx.moveCall({
    target: '0x2::kiosk::new',
    arguments: [],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    sender: account.address,
  });

  // Parse created objects to get Kiosk and KioskOwnerCap IDs
  return result;
}
```

### Placing Subscription in Kiosk

```typescript
async function placeInKiosk(
  subscriptionId: string,
  kioskId: string,
  kioskCapId: string,
  packageId: string
) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::subscription::place_in_kiosk`,
    arguments: [
      tx.object(kioskId),
      tx.object(kioskCapId),
      tx.object(subscriptionId)
    ],
  });

  await client.signAndExecuteTransaction({
    transaction: tx,
    sender: account.address,
  });
}
```

### Listing for Sale

```typescript
async function listForSale(
  subscriptionId: string,
  kioskId: string,
  kioskCapId: string,
  priceInSui: number,
  packageId: string
) {
  const tx = new Transaction();

  const priceInMist = priceInSui * 1_000_000_000;

  tx.moveCall({
    target: `${packageId}::subscription::list_for_sale`,
    arguments: [
      tx.object(kioskId),
      tx.object(kioskCapId),
      tx.pure.id(subscriptionId),
      tx.pure.u64(priceInMist)
    ],
  });

  await client.signAndExecuteTransaction({
    transaction: tx,
    sender: account.address,
  });
}
```

### Purchasing from Kiosk

```typescript
async function purchaseSubscription(
  sellerKioskId: string,
  subscriptionId: string,
  priceInSui: number,
  transferPolicyId: string,
  packageId: string
) {
  const tx = new Transaction();

  const priceInMist = priceInSui * 1_000_000_000;

  // 1. Purchase from Kiosk
  const [nft, transferRequest] = tx.moveCall({
    target: '0x2::kiosk::purchase',
    arguments: [
      tx.object(sellerKioskId),
      tx.pure.id(subscriptionId),
      tx.splitCoins(tx.gas, [priceInMist])
    ],
    typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
  });

  // 2. Calculate royalty
  const policy = await client.getObject({
    id: transferPolicyId,
    options: { showContent: true }
  });

  const royaltyBp = (policy.data.content as any).fields.rules.fields.amount_bp;
  const royaltyAmount = Math.floor((priceInMist * royaltyBp) / 10000);

  // 3. Pay royalty
  tx.moveCall({
    target: `${packageId}::marketplace_policies::pay_royalty`,
    arguments: [
      tx.object(transferPolicyId),
      transferRequest,
      tx.splitCoins(tx.gas, [royaltyAmount])
    ]
  });

  // 4. Confirm transfer
  tx.moveCall({
    target: '0x2::transfer_policy::confirm_request',
    arguments: [
      tx.object(transferPolicyId),
      transferRequest
    ],
    typeArguments: [`${packageId}::subscription::SubscriptionNFT`]
  });

  // 5. Transfer NFT to buyer
  tx.transferObjects([nft], account.address);

  await client.signAndExecuteTransaction({
    transaction: tx,
    sender: account.address,
  });
}
```

### Querying Kiosk Listings

```typescript
async function getKioskListings(kioskId: string) {
  // Get Kiosk object
  const kiosk = await client.getObject({
    id: kioskId,
    options: { showContent: true }
  });

  // Get listed items
  const content = (kiosk.data.content as any).fields;
  const items = content.items; // Map of item_id -> price

  // Fetch each item's details
  const listings = await Promise.all(
    Object.entries(items).map(async ([itemId, price]) => {
      const item = await client.getObject({
        id: itemId,
        options: { showContent: true }
      });

      return {
        subscriptionId: itemId,
        price: Number(price),
        ...parseSubscriptionNFT(item)
      };
    })
  );

  return listings;
}

function parseSubscriptionNFT(obj: any) {
  const fields = obj.data.content.fields;
  return {
    publicationId: fields.publication_id,
    tier: parseTier(fields.tier),
    subscribedAt: Number(fields.subscribed_at),
    expiresAt: Number(fields.expires_at),
    subscriber: fields.subscriber,
    remainingDays: Math.ceil(
      (Number(fields.expires_at) - Date.now() / 1000) / 86400
    )
  };
}

function parseTier(tierEnum: any): 'FREE' | 'BASIC' | 'PREMIUM' {
  // Handle Move enum serialization
  if (tierEnum.Free !== undefined) return 'FREE';
  if (tierEnum.Basic !== undefined) return 'BASIC';
  if (tierEnum.Premium !== undefined) return 'PREMIUM';
  throw new Error('Invalid tier');
}
```

## Royalty Economics

### Default Royalty: 10%

Publishers earn **10% of secondary sales** by default:

```
Subscription sold for 300 SUI:
├─> Seller receives: 270 SUI (90%)
└─> Publisher royalty: 30 SUI (10%)
```

### Royalty Justification

1. **Publisher value** - Content creator deserves ongoing revenue
2. **Sustainable ecosystem** - Incentivizes high-quality publications
3. **Market standard** - 10% is common in NFT marketplaces
4. **Flexible** - Publishers can adjust (0-100%)

### Example Scenarios

**High-Value Publication:**
```
Original subscription: 1000 SUI/month
Secondary sale (20 days left): 700 SUI
Royalty (10%): 70 SUI
Seller net: 630 SUI
```

**Low-Value Sale:**
```
Original subscription: 50 SUI/month
Secondary sale (10 days left): 20 SUI
Royalty (10%): 2 SUI
Seller net: 18 SUI
```

**Minimum Royalty Floor:**
```
Sale price: 5 SUI
Calculated royalty (10%): 0.5 SUI
Minimum floor: 1 SUI
Actual royalty: 1 SUI (minimum enforced)
```

## Best Practices

### For Subscribers

1. **Check expiry before buying**
   - Subscription value decreases as expiry approaches
   - Calculate price per remaining day

2. **Compare primary vs secondary**
   - New subscription: 500 SUI (30 days)
   - Used subscription: 350 SUI (20 days)
   - New is better: 16.67 SUI/day vs 17.5 SUI/day

3. **List strategically**
   - Price below primary subscription cost
   - Account for remaining time value
   - Consider royalty impact on buyer

4. **Use Kiosk for security**
   - Don't transfer NFTs directly for trades
   - Kiosk ensures atomic swap (NFT for SUI)
   - Policies enforce royalties automatically

### For Publishers

1. **Set reasonable royalties**
   - 10% default is fair
   - Higher royalties reduce liquidity
   - Consider your community's preferences

2. **Monitor secondary market**
   - High resale prices = strong demand
   - Low resale prices = consider price adjustments
   - Secondary market is price discovery

3. **Encourage trading**
   - Liquid markets benefit everyone
   - Easy gifting increases distribution
   - Tradeable subscriptions are more valuable

4. **Withdraw royalties regularly**
   - Royalties accumulate in TransferPolicy
   - Withdraw to fund operations or reinvest

### For Marketplace Builders

1. **Display expiry prominently**
   - Users need to see remaining time
   - Calculate price per day for comparison

2. **Show royalty costs**
   - Be transparent about total purchase cost
   - Display: Item price + Royalty = Total

3. **Filter and sort**
   - By tier (Free/Basic/Premium)
   - By expiry (most time remaining first)
   - By price per day
   - By publication popularity

4. **Historical data**
   - Show previous sale prices
   - Display trading volume
   - Track floor prices per publication

## Security Considerations

### Kiosk Safety

- **Atomic trades** - Kiosk ensures buyer gets NFT only if seller gets paid
- **Policy enforcement** - Royalties cannot be bypassed
- **Ownership proof** - KioskOwnerCap required for all owner actions

### Subscription Validation

```move
// Always check subscription validity before use
public fun has_tier_access(
    subscription: &SubscriptionNFT,
    required_tier: Tier,
    clock: &Clock
): bool {
    // Checks: 1) Not expired, 2) Tier sufficient
    if (!is_valid(subscription, clock)) {
        return false
    };

    let subscription_tier_level = tier_to_u8(&subscription.tier);
    let required_tier_level = tier_to_u8(&required_tier);

    subscription_tier_level >= required_tier_level
}
```

### Expired Subscriptions

**Important:** Expired subscriptions are **still tradeable** but have no access value:

- Buyers should always check `expires_at` field
- UI should clearly mark expired NFTs
- Consider implementing subscription renewal via secondary market

### Scam Prevention

**For Buyers:**
- Verify subscription belongs to correct publication
- Check `publication_id` matches expected publication
- Don't buy expired subscriptions unless speculating on renewal

**For Sellers:**
- List at fair market value (account for time remaining)
- Don't lie about expiry in descriptions
- Remember: All data is on-chain and verifiable

## UI/UX Recommendations

### Subscription Card (Marketplace Listing)

```typescript
interface SubscriptionListing {
  subscriptionId: string;
  publicationName: string;
  publicationImage: string;
  tier: 'FREE' | 'BASIC' | 'PREMIUM';
  expiresAt: number;  // Unix timestamp
  price: number;      // In SUI
  royaltyPercent: number;  // e.g., 10
  seller: string;     // Address
}

function SubscriptionCard({ listing }: { listing: SubscriptionListing }) {
  const remainingDays = Math.ceil(
    (listing.expiresAt - Date.now() / 1000) / 86400
  );
  const pricePerDay = listing.price / remainingDays;
  const totalCost = listing.price * (1 + listing.royaltyPercent / 100);

  return (
    <Card>
      <Image src={listing.publicationImage} />
      <Title>{listing.publicationName}</Title>
      <Badge tier={listing.tier}>{listing.tier}</Badge>

      <Price>
        <MainPrice>{listing.price} SUI</MainPrice>
        <Subtext>+{listing.royaltyPercent}% royalty = {totalCost} SUI total</Subtext>
      </Price>

      <ExpiryWarning>
        <Clock icon />
        {remainingDays} days remaining ({pricePerDay.toFixed(2)} SUI/day)
      </ExpiryWarning>

      <BuyButton onClick={() => purchase(listing)}>
        Purchase for {totalCost} SUI
      </BuyButton>
    </Card>
  );
}
```

### My Subscriptions View

```typescript
function MySubscriptionsView() {
  const subscriptions = useOwnedSubscriptions();

  return (
    <div>
      {subscriptions.map(sub => (
        <SubscriptionItem key={sub.id}>
          <Info>
            {sub.publicationName} - {sub.tier}
            <Expiry>Expires: {formatDate(sub.expiresAt)}</Expiry>
          </Info>

          <Actions>
            <Button onClick={() => useSubscription(sub)}>
              Read Articles
            </Button>

            <Button onClick={() => listForSale(sub)}>
              Sell on Marketplace
            </Button>

            <Button onClick={() => giftSubscription(sub)}>
              Gift to Friend
            </Button>
          </Actions>
        </SubscriptionItem>
      ))}
    </div>
  );
}
```

## Future Enhancements

### Potential Features

1. **Subscription Renewal via Kiosk**
   - Allow renewing expired subscriptions
   - Marketplace for "renewal services"

2. **Subscription Bundling**
   - Package multiple subscriptions
   - Sell as a bundle at discount

3. **Fractional Subscriptions**
   - Split Premium access among multiple users
   - Time-sharing mechanisms

4. **Subscription Derivatives**
   - Options contracts on subscription prices
   - Subscription index funds

5. **Reputation System**
   - Trusted sellers get badges
   - Verified publications

## Technical Limitations

### Current Constraints

1. **No partial transfers** - Must transfer entire subscription
2. **Fixed expiry** - Cannot extend expiry of sold subscriptions
3. **No refunds** - All sales final (enforced by Kiosk)
4. **Original subscriber field** - Remains unchanged after sale

### Workarounds

**Subscription renewal by new owner:**
```typescript
// New owner can renew even though subscriber field shows original owner
// Access control checks NFT ownership, not subscriber field
const renewed = await renewSubscription(subscriptionId);
```

## Frequently Asked Questions

### Can I use a subscription I bought on secondary market?

Yes! Access control checks **NFT ownership**, not the `subscriber` field. The `subscriber` field is historical (shows original purchaser) but doesn't affect functionality.

### What happens if subscription expires while listed?

The NFT remains listed but has no access value. Buyers should check expiry before purchasing. Some buyers may speculatively buy expired subscriptions hoping for renewal features.

### Can I sell a Free tier subscription?

Technically yes, but it has no inherent value since anyone can subscribe for free. Market will naturally price these at ~0.

### Do I need to pay gas to list?

Yes, listing requires a transaction which costs gas. However, gas costs on Sui are typically very low (<0.01 SUI).

### Can publishers block trading?

No. Once a subscription NFT is issued with `has store`, it's permanently transferable. This is by design for true digital ownership.

### What if I lose my KioskOwnerCap?

Your items in the Kiosk become inaccessible. Always backup or use multi-sig for valuable Kiosks. Consider using Sui wallets with recovery mechanisms.

### Can I have multiple Kiosks?

Yes! You can create as many Kiosks as you want. Some users maintain separate Kiosks for different asset types or trading strategies.

## Resources

### Documentation
- [Sui Kiosk Documentation](https://docs.sui.io/standards/kiosk)
- [Transfer Policy Guide](https://docs.sui.io/standards/kiosk/transfer-policy)
- [Subscription Module Source](../move/sources/subscription.move)
- [Marketplace Policies Source](../move/sources/marketplace_policies.move)

### Tools
- [Sui Explorer](https://suiexplorer.com) - View Kiosks and transactions
- [Sui Wallet](https://docs.sui.io/guides/developer/sui-101/wallets) - Manage NFTs
- Marketplace UIs - Third-party Kiosk frontends (to be added)

## See Also

- [Treasury Documentation](./TREASURY.md) - Platform fees (separate from royalties)
- [API Reference](./API_AND_CONTRACTS.md) - Complete function signatures
- [User Guide](./USER_GUIDE.md) - End-user trading instructions
- [Architecture](./ARCHITECTURE.md) - System design overview
