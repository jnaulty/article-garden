#[test_only]
module private_publishing::access_control_tests {
    use private_publishing::access_control;
    use private_publishing::publication;
    use private_publishing::subscription;
    use private_publishing::article;
    use private_publishing::treasury::{Self, Treasury};
    use sui::test_scenario;
    use sui::clock;
    use sui::coin;
    use sui::sui::SUI;

    const BASIC_PRICE: u64 = 5_000_000_000; // 5 SUI
    const PREMIUM_PRICE: u64 = 15_000_000_000; // 15 SUI

    #[test]
    fun test_verify_subscription_access_valid() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            // Create subscription
            let payment = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);
            let subscription = subscription::subscribe(
                &publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            // Create article requiring basic tier
            // Calculate deposit (1% of premium price)
            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Access the shared article in a new transaction
        test_scenario::next_tx(&mut scenario, creator);
        {
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let subscription = test_scenario::take_from_sender<subscription::SubscriptionNFT>(&scenario);

            // Verify access
            let has_access = access_control::verify_subscription_access(
                &subscription,
                &article,
                &clock
            );
            assert!(has_access);

            // Return shared objects
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, subscription);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_verify_subscription_access_expired() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let payment = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);
            let subscription = subscription::subscribe(
                &publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Advance time past expiry (31 days) and verify access denied
        clock::increment_for_testing(&mut clock, 31 * 86_400_000);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let subscription = test_scenario::take_from_sender<subscription::SubscriptionNFT>(&scenario);

            // Verify access denied for expired subscription
            let has_access = access_control::verify_subscription_access(
                &subscription,
                &article,
                &clock
            );
            assert!(!has_access);

            // Return objects
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, subscription);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_generate_read_token() {
        let creator = @0xCAFE;
        let reader = @0xBEEF;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Generate read token in a new transaction
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let publication = test_scenario::take_from_sender<publication::Publication>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Calculate daily price (monthly price / 30)
            let daily_price = BASIC_PRICE / 30;
            let payment = coin::mint_for_testing<SUI>(daily_price, ctx);

            // Generate read token
            let token = access_control::generate_read_token(
                &article,
                &publication,
                &mut treasury,
                payment,
                &clock,
                ctx
            );

            // Verify token
            assert!(access_control::token_article_id(&token) == article::id(&article));
            assert!(access_control::token_reader(&token) == creator);
            assert!(!access_control::is_token_expired(&token, &clock));

            // Clean up
            test_scenario::return_shared(treasury);
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publication);
            transfer::public_transfer(token, reader);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_verify_read_token() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Generate read token and verify in a new transaction
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let publication = test_scenario::take_from_sender<publication::Publication>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let daily_price = BASIC_PRICE / 30;
            let payment = coin::mint_for_testing<SUI>(daily_price, ctx);

            let token = access_control::generate_read_token(
                &article,
                &publication,
                &mut treasury,
                payment,
                &clock,
                ctx
            );

            // Verify token is valid
            let is_valid = access_control::verify_read_token(&token, &article, &clock);
            assert!(is_valid);

            // Advance time by 12 hours (still valid)
            clock::increment_for_testing(&mut clock, 12 * 3600 * 1000);
            let is_valid = access_control::verify_read_token(&token, &article, &clock);
            assert!(is_valid);

            // Advance time by another 13 hours (25 hours total, expired)
            clock::increment_for_testing(&mut clock, 13 * 3600 * 1000);
            let is_valid = access_control::verify_read_token(&token, &article, &clock);
            assert!(!is_valid);

            // Clean up
            test_scenario::return_shared(treasury);
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publication);
            transfer::public_transfer(token, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_read_token_wrong_article() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            // Create two articles for testing using the test helper to avoid shared object complexity
            let article1 = article::create_for_testing(
                publication::id(&publication),
                b"Article 1".to_string(),
                subscription::create_tier_basic(),
                published_at,
                ctx
            );
            
            let article2 = article::create_for_testing(
                publication::id(&publication),
                b"Article 2".to_string(),
                subscription::create_tier_basic(),
                published_at,
                ctx
            );

            let daily_price = BASIC_PRICE / 30;
            let payment = coin::mint_for_testing<SUI>(daily_price, ctx);

            // Generate token for article1
            let token = access_control::generate_read_token(
                &article1,
                &publication,
                &mut treasury,
                payment,
                &clock,
                ctx
            );

            // Token should not be valid for article2
            let is_valid = access_control::verify_read_token(&token, &article2, &clock);
            assert!(!is_valid);

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
            transfer::public_transfer(token, creator);
            transfer::public_transfer(article1, creator);
            transfer::public_transfer(article2, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_consume_read_token() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Generate and consume token in a new transaction
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let publication = test_scenario::take_from_sender<publication::Publication>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let daily_price = BASIC_PRICE / 30;
            let payment = coin::mint_for_testing<SUI>(daily_price, ctx);

            let token = access_control::generate_read_token(
                &article,
                &publication,
                &mut treasury,
                payment,
                &clock,
                ctx
            );

            // Consume token (deletes it)
            access_control::consume_read_token(token);

            // Clean up
            test_scenario::return_shared(treasury);
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publication);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = access_control::EInsufficientPayment)]
    fun test_generate_read_token_insufficient_payment() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(PREMIUM_PRICE / 100, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"Test excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Try to generate token with insufficient payment (should fail)
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let article = test_scenario::take_shared<article::Article>(&scenario);
            let publication = test_scenario::take_from_sender<publication::Publication>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Pay less than required
            let payment = coin::mint_for_testing<SUI>(1000, ctx);

            let token = access_control::generate_read_token(
                &article,
                &publication,
                &mut treasury,
                payment,
                &clock,
                ctx
            );

            test_scenario::return_shared(treasury);
            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publication);
            transfer::public_transfer(token, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
