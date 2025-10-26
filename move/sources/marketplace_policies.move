/// Module: marketplace_policies
/// Transfer policies for subscription NFT trading with royalty enforcement
/// Note: TransferPolicy must be created externally using Publisher from init()
module private_publishing::marketplace_policies {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::transfer_policy::{
        Self as policy,
        TransferPolicy,
        TransferPolicyCap,
        TransferRequest
    };
    use private_publishing::subscription::SubscriptionNFT;

    // Constants
    const MAX_BPS: u16 = 10_000; // 100%
    const DEFAULT_ROYALTY_BPS: u16 = 1_000; // 10%

    // Error codes
    const EInsufficientPayment: u64 = 1;
    const ERoyaltyTooHigh: u64 = 2;

    /// The Rule witness to authorize the transfer policy
    public struct Rule has drop {}

    /// Configuration for the royalty rule
    /// Defines the percentage of sale price that goes to the creator
    public struct Config has store, drop {
        /// Royalty percentage in basis points (10000 = 100%)
        amount_bp: u16,
        /// Minimum royalty amount in MIST
        min_amount: u64,
    }

    /// Creator action: Adds royalty rule to the transfer policy
    /// The royalty percentage is specified in basis points (1% = 100 bps)
    public fun add_royalty_rule(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        cap: &TransferPolicyCap<SubscriptionNFT>,
        amount_bp: u16,
        min_amount: u64
    ) {
        assert!(amount_bp <= MAX_BPS, ERoyaltyTooHigh);
        policy::add_rule(Rule {}, policy, cap, Config { amount_bp, min_amount })
    }

    /// Buyer action: Pays the royalty fee for the subscription transfer
    /// This must be called during the purchase transaction
    public fun pay_royalty(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        request: &mut TransferRequest<SubscriptionNFT>,
        payment: Coin<SUI>
    ) {
        let paid = policy::paid(request);
        let royalty_amount = calculate_royalty_amount(policy, paid);

        assert!(coin::value(&payment) == royalty_amount, EInsufficientPayment);

        // Add payment to policy balance (creator can withdraw later)
        policy::add_to_balance(Rule {}, policy, payment);

        // Mark rule as satisfied
        policy::add_receipt(Rule {}, request)
    }

    /// Helper function: Calculates the royalty amount based on sale price
    /// Returns the higher of: percentage-based amount or minimum amount
    public fun calculate_royalty_amount(
        policy: &TransferPolicy<SubscriptionNFT>,
        sale_price: u64
    ): u64 {
        let config: &Config = policy::get_rule(Rule {}, policy);

        // Calculate percentage-based royalty
        let percentage_amount = (
            ((sale_price as u128) * (config.amount_bp as u128) / 10_000) as u64
        );

        // Return the higher of percentage or minimum
        if (percentage_amount < config.min_amount) {
            config.min_amount
        } else {
            percentage_amount
        }
    }

    /// Creator action: Withdraws accumulated royalties from the policy
    public fun withdraw_royalties(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        cap: &TransferPolicyCap<SubscriptionNFT>,
        amount: Option<u64>,
        ctx: &mut TxContext
    ): Coin<SUI> {
        policy::withdraw(policy, cap, amount, ctx)
    }

    /// Creator action: Removes the royalty rule from policy
    public fun remove_royalty_rule(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        cap: &TransferPolicyCap<SubscriptionNFT>
    ) {
        policy::remove_rule<SubscriptionNFT, Rule, Config>(
            policy,
            cap
        );
    }

    // === Accessor Functions ===

    public fun royalty_bp(policy: &TransferPolicy<SubscriptionNFT>): u16 {
        let config: &Config = policy::get_rule(Rule {}, policy);
        config.amount_bp
    }

    public fun min_royalty_amount(policy: &TransferPolicy<SubscriptionNFT>): u64 {
        let config: &Config = policy::get_rule(Rule {}, policy);
        config.min_amount
    }

    public fun default_royalty_bps(): u16 {
        DEFAULT_ROYALTY_BPS
    }

    // === Test-only functions ===

    #[test_only]
    use sui::package;
    #[test_only]
    use sui::transfer_policy;

    #[test_only]
    /// Test witness for creating publisher
    public struct MARKETPLACE_POLICIES has drop {}

    #[test_only]
    public fun create_test_policy(
        ctx: &mut TxContext
    ): (TransferPolicy<SubscriptionNFT>, TransferPolicyCap<SubscriptionNFT>) {
        // In tests, we create a fake publisher to create the policy
        let publisher = package::test_claim(MARKETPLACE_POLICIES {}, ctx);
        let (policy, cap) = transfer_policy::new<SubscriptionNFT>(&publisher, ctx);
        package::burn_publisher(publisher);
        (policy, cap)
    }

    #[test_only]
    public fun add_test_royalty_rule(
        policy: &mut TransferPolicy<SubscriptionNFT>,
        cap: &TransferPolicyCap<SubscriptionNFT>
    ) {
        add_royalty_rule(policy, cap, DEFAULT_ROYALTY_BPS, 0)
    }
}
