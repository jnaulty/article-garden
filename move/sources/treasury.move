/// Module: treasury
/// Manages protocol treasury for collecting fees and deposits
module private_publishing::treasury {
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;

    // Constants
    const DEFAULT_SUBSCRIPTION_FEE_BPS: u64 = 100; // 100 basis points = 1%
    const DEFAULT_ARTICLE_DEPOSIT_BPS: u64 = 100; // 100 basis points = 1%
    const BPS_DENOMINATOR: u64 = 10000; // Basis points denominator

    // Error codes
    const EInsufficientBalance: u64 = 1;
    const EInvalidFeeRate: u64 = 2;
    const EZeroAmount: u64 = 3;

    // Events
    public struct TreasuryCreated has copy, drop {
        treasury_id: ID,
        admin: address,
    }

    public struct SubscriptionFeeCollected has copy, drop {
        amount: u64,
        publication_id: ID,
        subscriber: address,
    }

    public struct ArticleDepositCollected has copy, drop {
        amount: u64,
        publication_id: ID,
        publisher: address,
    }

    public struct PayPerArticleFeeCollected has copy, drop {
        amount: u64,
        article_id: ID,
        reader: address,
    }

    public struct TreasuryWithdrawal has copy, drop {
        amount: u64,
        recipient: address,
    }

    public struct FeeRatesUpdated has copy, drop {
        new_subscription_fee_bps: u64,
        new_article_deposit_bps: u64,
    }

    /// Shared treasury object holding protocol funds
    public struct Treasury has key {
        id: UID,
        balance: Balance<SUI>,
        subscription_fee_bps: u64,      // Fee rate for subscriptions
        article_deposit_bps: u64,       // Deposit rate for article publishing
        total_fees_collected: u64,      // Total subscription/pay-per-article fees
        total_deposits_collected: u64,  // Total article deposits
    }

    /// Admin capability for treasury management
    public struct TreasuryCap has key, store {
        id: UID,
    }

    /// Module initializer - creates treasury and admin capability
    fun init(ctx: &mut TxContext) {
        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            subscription_fee_bps: DEFAULT_SUBSCRIPTION_FEE_BPS,
            article_deposit_bps: DEFAULT_ARTICLE_DEPOSIT_BPS,
            total_fees_collected: 0,
            total_deposits_collected: 0,
        };

        let treasury_id = object::id(&treasury);

        event::emit(TreasuryCreated {
            treasury_id,
            admin: ctx.sender(),
        });

        // Share the treasury object for global access
        transfer::share_object(treasury);

        // Transfer admin capability to deployer
        transfer::public_transfer(
            TreasuryCap { id: object::new(ctx) },
            ctx.sender()
        );
    }

    /// Collects subscription fee from payment
    /// Returns the remaining amount after fee deduction
    public fun collect_subscription_fee(
        treasury: &mut Treasury,
        payment: &mut Coin<SUI>,
        publication_id: ID,
        subscriber: address,
        ctx: &mut TxContext
    ): u64 {
        let payment_amount = coin::value(payment);

        // Calculate fee
        let fee_amount = calculate_fee(payment_amount, treasury.subscription_fee_bps);

        if (fee_amount > 0) {
            // Split the fee from payment
            let fee_coin = coin::split(payment, fee_amount, ctx);

            // Add to treasury balance
            balance::join(&mut treasury.balance, coin::into_balance(fee_coin));

            // Update tracking
            treasury.total_fees_collected = treasury.total_fees_collected + fee_amount;

            event::emit(SubscriptionFeeCollected {
                amount: fee_amount,
                publication_id,
                subscriber,
            });
        };

        // Return remaining amount after fee
        payment_amount - fee_amount
    }

    /// Collects article publishing deposit
    /// The entire deposit amount goes to treasury (non-refundable)
    public fun collect_article_deposit(
        treasury: &mut Treasury,
        deposit: Coin<SUI>,
        publication_id: ID,
        publisher: address,
    ) {
        let deposit_amount = coin::value(&deposit);
        assert!(deposit_amount > 0, EZeroAmount);

        // Add entire deposit to treasury
        balance::join(&mut treasury.balance, coin::into_balance(deposit));

        // Update tracking
        treasury.total_deposits_collected = treasury.total_deposits_collected + deposit_amount;

        event::emit(ArticleDepositCollected {
            amount: deposit_amount,
            publication_id,
            publisher,
        });
    }

    /// Collects fee from pay-per-article payment
    /// Returns the remaining amount after fee deduction
    public fun collect_pay_per_article_fee(
        treasury: &mut Treasury,
        payment: &mut Coin<SUI>,
        article_id: ID,
        reader: address,
        ctx: &mut TxContext
    ): u64 {
        let payment_amount = coin::value(payment);

        // Calculate fee
        let fee_amount = calculate_fee(payment_amount, treasury.subscription_fee_bps);

        if (fee_amount > 0) {
            // Split the fee from payment
            let fee_coin = coin::split(payment, fee_amount, ctx);

            // Add to treasury balance
            balance::join(&mut treasury.balance, coin::into_balance(fee_coin));

            // Update tracking
            treasury.total_fees_collected = treasury.total_fees_collected + fee_amount;

            event::emit(PayPerArticleFeeCollected {
                amount: fee_amount,
                article_id,
                reader,
            });
        };

        // Return remaining amount after fee
        payment_amount - fee_amount
    }

    /// Withdraws funds from treasury (admin only)
    public fun withdraw(
        treasury: &mut Treasury,
        _cap: &TreasuryCap,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);

        let withdrawn = coin::from_balance(
            balance::split(&mut treasury.balance, amount),
            ctx
        );

        transfer::public_transfer(withdrawn, recipient);

        event::emit(TreasuryWithdrawal {
            amount,
            recipient,
        });
    }

    /// Updates fee rates (admin only)
    public fun update_fee_rates(
        treasury: &mut Treasury,
        _cap: &TreasuryCap,
        new_subscription_fee_bps: u64,
        new_article_deposit_bps: u64,
    ) {
        // Validate rates (max 10% = 1000 bps)
        assert!(new_subscription_fee_bps <= 1000, EInvalidFeeRate);
        assert!(new_article_deposit_bps <= 1000, EInvalidFeeRate);

        treasury.subscription_fee_bps = new_subscription_fee_bps;
        treasury.article_deposit_bps = new_article_deposit_bps;

        event::emit(FeeRatesUpdated {
            new_subscription_fee_bps,
            new_article_deposit_bps,
        });
    }

    /// Calculates article publishing deposit amount
    /// Based on the highest subscription tier price
    public fun calculate_article_deposit(
        treasury: &Treasury,
        premium_price: u64
    ): u64 {
        calculate_fee(premium_price, treasury.article_deposit_bps)
    }

    // === Helper Functions ===

    /// Calculates fee based on amount and basis points
    fun calculate_fee(amount: u64, fee_bps: u64): u64 {
        (amount * fee_bps) / BPS_DENOMINATOR
    }

    /// Splits a coin into fee and remainder
    /// Returns (fee_coin, remainder_coin)
    public fun split_payment_with_fee(
        mut payment: Coin<SUI>,
        fee_bps: u64,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>) {
        let payment_amount = coin::value(&payment);
        let fee_amount = calculate_fee(payment_amount, fee_bps);

        if (fee_amount > 0) {
            let fee_coin = coin::split(&mut payment, fee_amount, ctx);
            (fee_coin, payment)
        } else {
            (coin::zero(ctx), payment)
        }
    }

    // === Accessor Functions ===

    public fun balance(treasury: &Treasury): u64 {
        balance::value(&treasury.balance)
    }

    public fun subscription_fee_bps(treasury: &Treasury): u64 {
        treasury.subscription_fee_bps
    }

    public fun article_deposit_bps(treasury: &Treasury): u64 {
        treasury.article_deposit_bps
    }

    public fun total_fees_collected(treasury: &Treasury): u64 {
        treasury.total_fees_collected
    }

    public fun total_deposits_collected(treasury: &Treasury): u64 {
        treasury.total_deposits_collected
    }

    // === Test-only functions ===

    #[test_only]
    public fun calculate_fee_public(amount: u64, fee_bps: u64): u64 {
        calculate_fee(amount, fee_bps)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    #[test_only]
    public fun create_for_testing(ctx: &mut TxContext): (Treasury, TreasuryCap) {
        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            subscription_fee_bps: DEFAULT_SUBSCRIPTION_FEE_BPS,
            article_deposit_bps: DEFAULT_ARTICLE_DEPOSIT_BPS,
            total_fees_collected: 0,
            total_deposits_collected: 0,
        };

        let cap = TreasuryCap {
            id: object::new(ctx),
        };

        (treasury, cap)
    }

    #[test_only]
    public fun destroy_for_testing(treasury: Treasury) {
        let Treasury {
            id,
            balance,
            subscription_fee_bps: _,
            article_deposit_bps: _,
            total_fees_collected: _,
            total_deposits_collected: _,
        } = treasury;

        balance::destroy_zero(balance);
        object::delete(id);
    }
}