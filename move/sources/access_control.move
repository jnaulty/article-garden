/// Module: access_control
/// Manages access permissions and verification for encrypted articles
module private_publishing::access_control {
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use private_publishing::article::{Self, Article};
    use private_publishing::subscription::{Self, SubscriptionNFT};
    use private_publishing::publication::{Self, Publication};
    use private_publishing::analytics::{Self, PublicationStats};
    use private_publishing::treasury::{Self, Treasury};

    // Constants
    const TOKEN_VALIDITY_SECONDS: u64 = 24 * 60 * 60; // 24 hours

    // Error codes
    const EInsufficientPayment: u64 = 1;
    const EInvalidArticleId: u64 = 2;

    // Events
    public struct ReadTokenGenerated has copy, drop {
        token_id: ID,
        article_id: ID,
        reader: address,
        expires_at: u64,
    }

    /// Temporary access token for reading a single article
    /// Used for pay-per-article model
    public struct ReadToken has key, store {
        id: UID,
        article_id: ID,
        reader: address,
        created_at: u64,
        expires_at: u64,
    }

    /// Verifies that a user has valid subscription access to an article
    /// Checks tier level and expiry
    public fun verify_subscription_access(
        subscription: &SubscriptionNFT,
        article: &Article,
        clock: &Clock,
    ): bool {
        // Check subscription belongs to article's publication
        if (subscription::publication_id(subscription) != article::publication_id(article)) {
            return false
        };

        // Check if subscription is valid (not expired)
        if (!subscription::is_valid(subscription, clock)) {
            return false
        };

        // Check if subscription tier has access to article tier
        subscription::has_tier_access(subscription, article::tier(article), clock)
    }

    /// Generates a read token for pay-per-article access
    /// User pays a small fee to unlock single article for 24 hours
    /// Collects treasury fee from payment
    /// Note: Caller should call analytics::record_revenue() if needed
    public fun generate_read_token(
        article: &Article,
        publication: &Publication,
        treasury: &mut Treasury,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ReadToken {
        let reader = ctx.sender();
        let article_id = article::id(article);

        // Verify article belongs to publication
        assert!(article::publication_id(article) == publication::id(publication), EInvalidArticleId);

        // Calculate required payment based on article tier (daily rate)
        let tier = article::tier(article);
        let required_payment = if (subscription::is_tier_free(&tier)) {
            0
        } else if (subscription::is_tier_basic(&tier)) {
            publication::basic_price(publication) / 30
        } else {
            // Premium tier
            publication::premium_price(publication) / 30
        };

        let paid_amount = coin::value(&payment);
        assert!(paid_amount >= required_payment, EInsufficientPayment);

        // Transfer payment to creator
        if (required_payment > 0) {
            // Collect treasury fee and get creator's portion
            let _creator_amount = treasury::collect_pay_per_article_fee(
                treasury,
                &mut payment,
                article_id,
                reader,
                ctx
            );

            // Transfer remaining payment to creator
            transfer::public_transfer(payment, publication::creator(publication));
        } else {
            coin::destroy_zero(payment);
        };

        let current_time = clock::timestamp_ms(clock) / 1000;
        let expires_at = current_time + TOKEN_VALIDITY_SECONDS;

        let token_uid = object::new(ctx);
        let token_id = object::uid_to_inner(&token_uid);

        event::emit(ReadTokenGenerated {
            token_id,
            article_id,
            reader,
            expires_at,
        });

        ReadToken {
            id: token_uid,
            article_id,
            reader,
            created_at: current_time,
            expires_at,
        }
    }

    /// Verifies a read token is valid for accessing an article
    public fun verify_read_token(
        token: &ReadToken,
        article: &Article,
        clock: &Clock,
    ): bool {
        // Check token is for this article
        if (token.article_id != article::id(article)) {
            return false
        };

        // Check token is not expired
        let current_time = clock::timestamp_ms(clock) / 1000;
        if (current_time > token.expires_at) {
            return false
        };

        true
    }

    /// Checks if a reader has any valid access method (subscription or read token)
    /// Returns true if access is granted
    public fun has_article_access(
        article: &Article,
        subscription_opt: &Option<SubscriptionNFT>,
        token_opt: &Option<ReadToken>,
        clock: &Clock,
    ): bool {
        // Check subscription access first
        if (subscription_opt.is_some()) {
            let subscription = subscription_opt.borrow();
            if (verify_subscription_access(subscription, article, clock)) {
                return true
            };
        };

        // Check read token access
        if (token_opt.is_some()) {
            let token = token_opt.borrow();
            if (verify_read_token(token, article, clock)) {
                return true
            };
        };

        // No valid access method
        false
    }

    /// Consumes a read token after use (optional - can keep token for 24h access)
    public fun consume_read_token(token: ReadToken) {
        let ReadToken { id, article_id: _, reader: _, created_at: _, expires_at: _ } = token;
        object::delete(id);
    }

    /// Records a view of an article in analytics
    /// Should be called when a reader successfully accesses an article
    public fun record_article_view(
        stats: &mut PublicationStats,
        article: &Article,
    ) {
        // Verify stats belongs to article's publication
        assert!(
            analytics::publication_id(stats) == article::publication_id(article),
            EInvalidArticleId
        );

        // Record the view
        analytics::record_view(stats, article::id(article));
    }

    // === Accessor Functions ===

    public fun token_article_id(token: &ReadToken): ID {
        token.article_id
    }

    public fun token_reader(token: &ReadToken): address {
        token.reader
    }

    public fun token_expires_at(token: &ReadToken): u64 {
        token.expires_at
    }

    public fun is_token_expired(token: &ReadToken, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock) / 1000;
        current_time > token.expires_at
    }

    // === Test-only functions ===

    #[test_only]
    public fun create_read_token_for_testing(
        article_id: ID,
        expires_at: u64,
        ctx: &mut TxContext
    ): ReadToken {
        ReadToken {
            id: object::new(ctx),
            article_id,
            reader: ctx.sender(),
            created_at: 0,
            expires_at,
        }
    }
}
