/// Module: subscription
/// Manages subscription NFTs with tier-based access and Kiosk integration
module private_publishing::subscription {
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use private_publishing::publication::{Self, Publication};
    use private_publishing::treasury::{Self, Treasury};

    // Constants
    const SECONDS_PER_MONTH: u64 = 30 * 24 * 60 * 60; // 30 days

    // Error codes
    const EInvalidTier: u64 = 1;
    const EInsufficientPayment: u64 = 2;
    const EInvalidPublicationId: u64 = 3;

    // Events
    public struct SubscriptionCreated has copy, drop {
        subscription_id: ID,
        publication_id: ID,
        subscriber: address,
        tier: u8,
        expires_at: u64,
    }

    public struct SubscriptionRenewed has copy, drop {
        subscription_id: ID,
        new_expiry: u64,
    }

    /// Subscription tiers with different access levels
    public enum Tier has copy, drop, store {
        Free,
        Basic,
        Premium,
    }

    /// NFT representing a subscription to a publication
    public struct SubscriptionNFT has key, store {
        id: UID,
        publication_id: ID,
        tier: Tier,
        subscribed_at: u64,
        expires_at: u64,
        subscriber: address,
    }

    /// Creates a new subscription NFT
    /// Validates payment based on tier and publication pricing
    /// Collects treasury fee from payment
    /// Note: Caller should call analytics::record_subscription() and analytics::record_revenue()
    /// Note: SubscriptionNFT remains owned by subscriber (can be traded/sold in Kiosk)
    public fun subscribe(
        publication: & Publication,
        treasury: &mut Treasury,
        tier: Tier,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): SubscriptionNFT {
        let subscriber = ctx.sender();
        let publication_id = publication::id(publication);
        let current_time = clock::timestamp_ms(clock) / 1000; // Convert to seconds

        // Validate tier and payment
        let required_payment = match (tier) {
            Tier::Free => {
                assert!(publication::free_tier_enabled(publication), EInvalidTier);
                0
            },
            Tier::Basic => publication::basic_price(publication),
            Tier::Premium => publication::premium_price(publication),
        };

        let paid_amount = coin::value(&payment);
        assert!(paid_amount >= required_payment, EInsufficientPayment);

        // Transfer payment to creator (or destroy if free)
        if (required_payment > 0) {
            // Collect treasury fee and get creator's portion
            let _creator_amount = treasury::collect_subscription_fee(
                treasury,
                &mut payment,
                publication_id,
                subscriber,
                ctx
            );

            // Transfer remaining payment to creator
            transfer::public_transfer(payment, publication::creator(publication));
        } else {
            // For free tier, payment should be empty, destroy the coin
            coin::destroy_zero(payment);
        };

        // Calculate expiry (30 days from now)
        let expires_at = current_time + SECONDS_PER_MONTH;

        let subscription_uid = object::new(ctx);
        let subscription_id = object::uid_to_inner(&subscription_uid);

        event::emit(SubscriptionCreated {
            subscription_id,
            publication_id,
            subscriber,
            tier: tier_to_u8(&tier),
            expires_at,
        });

        SubscriptionNFT {
            id: subscription_uid,
            publication_id,
            tier,
            subscribed_at: current_time,
            expires_at,
            subscriber,
        }
    }

    /// Renews an existing subscription
    /// Extends expiry by 30 days
    /// Collects treasury fee from payment
    /// Note: Caller should call analytics::record_revenue() if needed
    public fun renew(
        subscription: &mut SubscriptionNFT,
        publication: &Publication,
        treasury: &mut Treasury,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let publication_id = publication::id(publication);
        assert!(subscription.publication_id == publication_id, EInvalidPublicationId);

        // Validate payment
        let required_payment = match (subscription.tier) {
            Tier::Free => 0,
            Tier::Basic => publication::basic_price(publication),
            Tier::Premium => publication::premium_price(publication),
        };

        let paid_amount = coin::value(&payment);
        assert!(paid_amount >= required_payment, EInsufficientPayment);

        // Transfer payment to creator (or destroy if free)
        if (required_payment > 0) {
            // Collect treasury fee and get creator's portion
            let _creator_amount = treasury::collect_subscription_fee(
                treasury,
                &mut payment,
                publication_id,
                subscription.subscriber,
                ctx
            );

            // Transfer remaining payment to creator
            transfer::public_transfer(payment, publication::creator(publication));
        } else {
            // For free tier renewal, payment should be empty, destroy the coin
            coin::destroy_zero(payment);
        };

        // Extend expiry
        let current_time = clock::timestamp_ms(clock) / 1000;

        // If not expired, extend from current expiry, otherwise from now
        if (subscription.expires_at > current_time) {
            subscription.expires_at = subscription.expires_at + SECONDS_PER_MONTH;
        } else {
            subscription.expires_at = current_time + SECONDS_PER_MONTH;
        };

        event::emit(SubscriptionRenewed {
            subscription_id: object::id(subscription),
            new_expiry: subscription.expires_at,
        });
    }

    /// Places subscription NFT in a Kiosk
    public fun place_in_kiosk(
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        subscription: SubscriptionNFT,
    ) {
        kiosk::place(kiosk, cap, subscription);
    }

    /// Takes subscription NFT from Kiosk
    public fun take_from_kiosk(
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        subscription_id: ID,
    ): SubscriptionNFT {
        kiosk::take<SubscriptionNFT>(kiosk, cap, subscription_id)
    }

    /// Lists subscription for sale in Kiosk marketplace
    public fun list_for_sale(
        kiosk: &mut Kiosk,
        cap: &KioskOwnerCap,
        subscription_id: ID,
        price: u64,
    ) {
        kiosk::list<SubscriptionNFT>(kiosk, cap, subscription_id, price);
    }

    /// Checks if subscription is valid (not expired)
    public fun is_valid(subscription: &SubscriptionNFT, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock) / 1000;
        subscription.expires_at > current_time
    }

    /// Verifies subscription has required tier or higher
    public fun has_tier_access(subscription: &SubscriptionNFT, required_tier: Tier, clock: &Clock): bool {
        if (!is_valid(subscription, clock)) {
            return false
        };

        let subscription_tier_level = tier_to_u8(&subscription.tier);
        let required_tier_level = tier_to_u8(&required_tier);

        subscription_tier_level >= required_tier_level
    }

    // === Helper Functions ===

    /// Converts Tier enum to u8 for comparison
    fun tier_to_u8(tier: &Tier): u8 {
        match (tier) {
            Tier::Free => 0,
            Tier::Basic => 1,
            Tier::Premium => 2,
        }
    }

    /// Public helper to convert Tier to u8 (for other modules)
    public fun tier_to_u8_public(tier: &Tier): u8 {
        tier_to_u8(tier)
    }

    /// Check if tier is Free
    public fun is_tier_free(tier: &Tier): bool {
        tier_to_u8(tier) == 0
    }

    /// Check if tier is Basic
    public fun is_tier_basic(tier: &Tier): bool {
        tier_to_u8(tier) == 1
    }

    /// Check if tier is Premium
    public fun is_tier_premium(tier: &Tier): bool {
        tier_to_u8(tier) == 2
    }

    // === Accessor Functions ===

    public fun id(subscription: &SubscriptionNFT): ID {
        object::id(subscription)
    }

    public fun publication_id(subscription: &SubscriptionNFT): ID {
        subscription.publication_id
    }

    public fun tier(subscription: &SubscriptionNFT): Tier {
        subscription.tier
    }

    public fun subscribed_at(subscription: &SubscriptionNFT): u64 {
        subscription.subscribed_at
    }

    public fun expires_at(subscription: &SubscriptionNFT): u64 {
        subscription.expires_at
    }

    public fun subscriber(subscription: &SubscriptionNFT): address {
        subscription.subscriber
    }

    // === Tier Constructor Functions (for TypeScript tests) ===

    /// Creates a Free tier enum value
    public fun create_tier_free(): Tier { Tier::Free }

    /// Creates a Basic tier enum value
    public fun create_tier_basic(): Tier { Tier::Basic }

    /// Creates a Premium tier enum value
    public fun create_tier_premium(): Tier { Tier::Premium }

    // === Test-only functions ===

    #[test_only]
    public fun create_for_testing(
        publication_id: ID,
        tier: Tier,
        expires_at: u64,
        ctx: &mut TxContext
    ): SubscriptionNFT {
        SubscriptionNFT {
            id: object::new(ctx),
            publication_id,
            tier,
            subscribed_at: 0,
            expires_at,
            subscriber: ctx.sender(),
        }
    }
}
