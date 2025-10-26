# Kiosk & Transfer Policies Guide

## Why Kiosk for Subscriptions?

**Kiosk** is Sui's primitive for building marketplaces with enforceable policies. Perfect for:
- ✅ NFT subscriptions with transfer rules
- ✅ Automatic royalty payments
- ✅ Secondary market trading
- ✅ Time-locked assets (expiring subscriptions)
- ✅ Flexible access control

## Core Concepts

### 1. Kiosk Structure

```
Kiosk (Shared Object)
├── Owner: KioskOwnerCap
├── Items: SubscriptionNFTs
├── Listings: Items for sale
└── Locks: Non-transferable items
```

### 2. Transfer Policy

```
TransferPolicy<SubscriptionNFT>
├── Rules:
│   ├── Royalty (10-15%)
│   ├── Min Price (prevent dumping)
│   └── Creator Verification
└── PolicyCap (admin control)
```

### 3. Transfer Request Flow

```
Buyer initiates purchase
    ↓
TransferRequest created
    ↓
Policy rules verified
    ↓
Royalty paid to creator
    ↓
NFT transferred to buyer
    ↓
Request resolved
```

## Implementation

### Module: subscription.move

```move
module private_publishing::subscription {
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{
        Self,
        TransferPolicy,
        TransferPolicyCap,
        TransferRequest,
    };
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};

    /// Subscription tiers
    public enum Tier has copy, drop, store {
        Free,
        Basic,    // 5 SUI/month
        Premium,  // 15 SUI/month
    }

    /// Subscription NFT (stored in Kiosk)
    public struct SubscriptionNFT has key, store {
        id: UID,
        publication_id: ID,
        tier: Tier,
        subscribed_at: u64,
        expires_at: u64,
        renewable: bool,
    }

    /// Initialize transfer policy for subscriptions
    public fun init_transfer_policy(
        publisher: &Publisher,
        ctx: &mut TxContext
    ): (TransferPolicy<SubscriptionNFT>, TransferPolicyCap<SubscriptionNFT>) {
        let (policy, cap) = transfer_policy::new<SubscriptionNFT>(
            publisher,
            ctx
        );

        (policy, cap)
    }

    /// Add royalty rule to policy
    public fun add_royalty_rule(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        cap: &TransferPolicyCap<SubscriptionNFT>,
        royalty_bps: u64,  // 1000 = 10%
        min_price: u64,
    ) {
        let rule = RoyaltyRule {
            royalty_bps,
            min_price,
        };

        transfer_policy::add_rule(policy, cap, rule);
    }

    /// Subscribe and place in Kiosk
    public fun subscribe_and_place(
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        publication_id: ID,
        tier: Tier,
        payment: Coin<SUI>,
        policy: &TransferPolicy<SubscriptionNFT>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify payment
        let required = get_tier_price(tier);
        assert!(coin::value(&payment) >= required, EInsufficientPayment);

        // Create subscription NFT
        let expires_at = clock::timestamp_ms(clock) + MONTH_MS;
        let subscription = SubscriptionNFT {
            id: object::new(ctx),
            publication_id,
            tier,
            subscribed_at: clock::timestamp_ms(clock),
            expires_at,
            renewable: true,
        };

        // Place in Kiosk
        kiosk::place(kiosk, kiosk_cap, subscription);

        // Transfer payment to publication creator
        // (simplified - actual implementation would split fees)
        transfer::public_transfer(payment, publication_creator);
    }

    /// List subscription for sale in Kiosk
    public fun list_subscription(
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        subscription_id: ID,
        price: u64,
    ) {
        kiosk::list<SubscriptionNFT>(kiosk, kiosk_cap, subscription_id, price);
    }

    /// Purchase subscription from Kiosk
    public fun purchase_subscription(
        buyer_kiosk: &mut Kiosk,
        seller_kiosk: &mut Kiosk,
        subscription_id: ID,
        payment: Coin<SUI>,
        policy: &TransferPolicy<SubscriptionNFT>,
        ctx: &mut TxContext
    ): TransferRequest<SubscriptionNFT> {
        // Purchase from seller's Kiosk
        let (subscription, transfer_request) = kiosk::purchase<SubscriptionNFT>(
            seller_kiosk,
            subscription_id,
            payment
        );

        // Place in buyer's Kiosk
        kiosk::place(buyer_kiosk, subscription);

        transfer_request
    }

    /// Verify subscription is valid
    public fun is_subscription_valid(
        subscription: &SubscriptionNFT,
        clock: &Clock
    ): bool {
        let now = clock::timestamp_ms(clock);
        subscription.expires_at > now
    }

    /// Check if tier grants access to article
    public fun has_tier_access(
        subscription_tier: Tier,
        required_tier: Tier
    ): bool {
        // Free < Basic < Premium
        match (subscription_tier, required_tier) {
            (_, Tier::Free) => true,
            (Tier::Basic, Tier::Basic) => true,
            (Tier::Premium, _) => true,
            _ => false,
        }
    }
}
```

### Module: royalty_rule.move

```move
module private_publishing::royalty_rule {
    use sui::transfer_policy::{
        Self,
        TransferPolicy,
        TransferRequest,
    };
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    /// Rule configuration
    public struct RoyaltyRule has store, drop {
        royalty_bps: u64,  // Basis points (1000 = 10%)
        min_price: u64,    // Minimum transfer price
    }

    /// Witness for rule
    public struct Witness has drop {}

    /// Verify and collect royalty
    public fun pay_royalty<T: key + store>(
        policy: &TransferPolicy<T>,
        request: &mut TransferRequest<T>,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let rule = transfer_policy::get_rule<T, RoyaltyRule, Witness>(
            policy,
            Witness {}
        );

        let price = coin::value(&payment);

        // Verify minimum price
        assert!(price >= rule.min_price, EBelowMinPrice);

        // Calculate royalty
        let royalty_amount = (price * rule.royalty_bps) / 10000;
        let royalty = coin::split(&mut payment, royalty_amount, ctx);

        // Pay royalty to creator
        let creator = transfer_policy::creator<T>(policy);
        transfer::public_transfer(royalty, creator);

        // Return remaining payment to seller
        transfer::public_transfer(payment, ctx.sender());

        // Mark rule as satisfied
        transfer_policy::add_receipt(request, Witness {});
    }
}
```

## Frontend Integration

### Create User Kiosk

```typescript
// hooks/useKiosk.ts
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function useKiosk() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const createKiosk = async () => {
    const tx = new Transaction();

    // Create new Kiosk
    tx.moveCall({
      target: '0x2::kiosk::new',
      arguments: [],
    });

    const result = await signAndExecute({ transaction: tx });
    return result.objectChanges; // Extract Kiosk ID and Cap ID
  };

  return { createKiosk };
}
```

### Subscribe and Place in Kiosk

```typescript
// hooks/useSubscribe.ts
export function useSubscribe() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const subscribe = async (
    kioskId: string,
    kioskCapId: string,
    publicationId: string,
    tier: 'Free' | 'Basic' | 'Premium'
  ) => {
    const tx = new Transaction();

    // Split payment coin
    const tierPrice = tier === 'Basic' ? 5_000_000_000 : 15_000_000_000;
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(tierPrice)]);

    // Subscribe and place in Kiosk
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::subscribe_and_place`,
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.pure.id(publicationId),
        tx.pure.u8(tier === 'Free' ? 0 : tier === 'Basic' ? 1 : 2),
        payment,
        tx.object(TRANSFER_POLICY_ID),
        tx.object('0x6'), // Clock
      ],
    });

    await signAndExecute({ transaction: tx });
  };

  return { subscribe };
}
```

### List Subscription for Sale

```typescript
// hooks/useListSubscription.ts
export function useListSubscription() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const listForSale = async (
    kioskId: string,
    kioskCapId: string,
    subscriptionId: string,
    price: number // in SUI
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::list_subscription`,
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.pure.id(subscriptionId),
        tx.pure.u64(price * 1_000_000_000), // Convert to MIST
      ],
    });

    await signAndExecute({ transaction: tx });
  };

  return { listForSale };
}
```

### Purchase from Marketplace

```typescript
// hooks/usePurchaseSubscription.ts
export function usePurchaseSubscription() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const purchase = async (
    buyerKioskId: string,
    sellerKioskId: string,
    subscriptionId: string,
    price: number
  ) => {
    const tx = new Transaction();

    // Split payment
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(price)]);

    // Purchase and resolve transfer
    const transferRequest = tx.moveCall({
      target: `${PACKAGE_ID}::subscription::purchase_subscription`,
      arguments: [
        tx.object(buyerKioskId),
        tx.object(sellerKioskId),
        tx.pure.id(subscriptionId),
        payment,
        tx.object(TRANSFER_POLICY_ID),
      ],
    });

    // Pay royalty
    tx.moveCall({
      target: `${PACKAGE_ID}::royalty_rule::pay_royalty`,
      typeArguments: [`${PACKAGE_ID}::subscription::SubscriptionNFT`],
      arguments: [
        tx.object(TRANSFER_POLICY_ID),
        transferRequest,
        payment,
      ],
    });

    await signAndExecute({ transaction: tx });
  };

  return { purchase };
}
```

### Check Access

```typescript
// hooks/useCheckAccess.ts
export function useCheckAccess(articleId: string) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const checkAccess = async (): Promise<boolean> => {
    if (!account) return false;

    // Query user's Kiosk
    const kiosks = await suiClient.getOwnedObjects({
      owner: account.address,
      filter: {
        StructType: '0x2::kiosk::Kiosk',
      },
    });

    if (kiosks.data.length === 0) return false;

    const kioskId = kiosks.data[0].data.objectId;

    // Query subscriptions in Kiosk
    const kioskData = await suiClient.getObject({
      id: kioskId,
      options: { showContent: true },
    });

    // Check if user has valid subscription for this publication
    // (simplified - actual implementation would check subscription details)
    return true; // or false based on verification
  };

  return { checkAccess };
}
```

## UI Components

### Subscription Card in Kiosk

```typescript
// components/SubscriptionCard.tsx
interface SubscriptionCardProps {
  subscription: SubscriptionNFT;
  onList: () => void;
  onRenew: () => void;
}

export function SubscriptionCard({ subscription, onList, onRenew }: SubscriptionCardProps) {
  const isExpired = subscription.expires_at < Date.now();
  const daysRemaining = Math.floor(
    (subscription.expires_at - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">{subscription.publication_name}</h3>
        <span className={`px-2 py-1 rounded text-sm ${
          subscription.tier === 'Premium' ? 'bg-purple-100' : 'bg-blue-100'
        }`}>
          {subscription.tier}
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {isExpired ? (
          <span className="text-red-600">Expired</span>
        ) : (
          <span>{daysRemaining} days remaining</span>
        )}
      </div>

      <div className="flex gap-2">
        {!isExpired && (
          <button
            onClick={onList}
            className="flex-1 py-2 border rounded hover:bg-gray-50"
          >
            List for Sale
          </button>
        )}

        <button
          onClick={onRenew}
          className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isExpired ? 'Resubscribe' : 'Renew'}
        </button>
      </div>
    </div>
  );
}
```

### Marketplace Listing

```typescript
// components/MarketplaceListing.tsx
interface MarketplaceListingProps {
  subscription: SubscriptionNFT;
  price: number;
  seller: string;
  onPurchase: () => void;
}

export function MarketplaceListing({
  subscription,
  price,
  seller,
  onPurchase,
}: MarketplaceListingProps) {
  const daysRemaining = Math.floor(
    (subscription.expires_at - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const royaltyAmount = price * 0.1; // 10% royalty
  const youPay = price + royaltyAmount;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold mb-2">{subscription.publication_name}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>
          <div className="text-gray-600">Tier</div>
          <div className="font-semibold">{subscription.tier}</div>
        </div>
        <div>
          <div className="text-gray-600">Time Left</div>
          <div className="font-semibold">{daysRemaining} days</div>
        </div>
        <div>
          <div className="text-gray-600">Seller</div>
          <div className="font-mono text-xs">{truncate(seller)}</div>
        </div>
        <div>
          <div className="text-gray-600">Price</div>
          <div className="font-bold text-blue-600">{price} SUI</div>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-3">
        + {royaltyAmount} SUI royalty = {youPay} SUI total
      </div>

      <button
        onClick={onPurchase}
        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Purchase
      </button>
    </div>
  );
}
```

## Advanced Patterns

### Auto-Renewal

```move
/// Enable auto-renewal with escrowed payment
public fun enable_auto_renew(
    subscription: &mut SubscriptionNFT,
    payment: Coin<SUI>,
) {
    assert!(coin::value(&payment) >= RENEWAL_PRICE, EInsufficientPayment);

    // Store payment for future renewal
    subscription.renewal_payment = option::some(payment);
    subscription.auto_renew = true;
}

/// Cron job calls this monthly
public fun process_renewal(
    subscription: &mut SubscriptionNFT,
    clock: &Clock,
) {
    if (!subscription.auto_renew) return;

    let payment = option::extract(&mut subscription.renewal_payment);

    // Extend subscription
    subscription.expires_at = subscription.expires_at + MONTH_MS;

    // Transfer payment to creator
    transfer::public_transfer(payment, subscription.creator);
}
```

### Gifting Subscriptions

```move
/// Purchase subscription for someone else
public fun gift_subscription(
    recipient_kiosk: &mut Kiosk,
    publication_id: ID,
    tier: Tier,
    payment: Coin<SUI>,
    ctx: &mut TxContext
) {
    let subscription = create_subscription(
        publication_id,
        tier,
        ctx
    );

    // Place in recipient's Kiosk (they must own the Kiosk)
    kiosk::place(recipient_kiosk, subscription);

    // Transfer payment
    transfer::public_transfer(payment, publication_creator);
}
```

## Testing

```typescript
describe('Kiosk Integration', () => {
  it('should create Kiosk and subscribe', async () => {
    // Create Kiosk
    const { kioskId, capId } = await createKiosk();

    // Subscribe
    await subscribe(kioskId, capId, publicationId, 'Basic');

    // Verify subscription in Kiosk
    const kiosk = await getKiosk(kioskId);
    expect(kiosk.items).toHaveLength(1);
  });

  it('should list and purchase subscription', async () => {
    // List
    await listForSale(kioskId, capId, subscriptionId, 3);

    // Purchase
    await purchase(buyerKioskId, sellerKioskId, subscriptionId, 3e9);

    // Verify transfer
    const buyerKiosk = await getKiosk(buyerKioskId);
    expect(buyerKiosk.items).toContain(subscriptionId);
  });

  it('should pay royalty on transfer', async () => {
    const creatorBalanceBefore = await getBalance(creator);

    await purchase(buyerKioskId, sellerKioskId, subscriptionId, 10e9);

    const creatorBalanceAfter = await getBalance(creator);
    const royalty = creatorBalanceAfter - creatorBalanceBefore;

    expect(royalty).toBe(1e9); // 10% of 10 SUI
  });
});
```

## Best Practices

1. **Always use Kiosk for subscriptions** - Enables marketplace trading
2. **Set transfer policies** - Enforce royalties automatically
3. **Verify expiry** - Check subscription validity before granting access
4. **Support gifting** - Allow purchasing for others
5. **Enable renewals** - Make it easy to extend subscriptions

---

**Kiosk + Transfer Policies = Perfect for NFT subscriptions with enforceable creator royalties!**
