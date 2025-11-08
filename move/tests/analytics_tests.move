#[test_only]
module private_publishing::analytics_tests {
    use private_publishing::analytics;
    use private_publishing::publication;
    use private_publishing::subscription;
    use sui::test_scenario;

    #[test]
    fun test_create_stats() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            // Verify initial stats
            assert!(analytics::publication_id(&stats) == publication::id(&publication));

            let (counts, revenue, _views) = analytics::get_stats(&stats, &publisher_cap);
            assert!(analytics::total_subscribers(&counts) == 0);
            assert!(analytics::free_subscribers(&counts) == 0);
            assert!(analytics::basic_subscribers(&counts) == 0);
            assert!(analytics::premium_subscribers(&counts) == 0);
            assert!(revenue == 0);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_subscription_free() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            // Record free tier subscription
            analytics::record_subscription(&mut stats, subscription::create_tier_free());

            let counts = analytics::get_subscriber_counts(&stats, &publisher_cap);
            assert!(analytics::free_subscribers(&counts) == 1);
            assert!(analytics::basic_subscribers(&counts) == 0);
            assert!(analytics::premium_subscribers(&counts) == 0);
            assert!(analytics::total_subscribers(&counts) == 1);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_subscription_basic() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            analytics::record_subscription(&mut stats, subscription::create_tier_basic());

            let counts = analytics::get_subscriber_counts(&stats, &publisher_cap);
            assert!(analytics::free_subscribers(&counts) == 0);
            assert!(analytics::basic_subscribers(&counts) == 1);
            assert!(analytics::premium_subscribers(&counts) == 0);
            assert!(analytics::total_subscribers(&counts) == 1);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_subscription_premium() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            analytics::record_subscription(&mut stats, subscription::create_tier_premium());

            let counts = analytics::get_subscriber_counts(&stats, &publisher_cap);
            assert!(analytics::free_subscribers(&counts) == 0);
            assert!(analytics::basic_subscribers(&counts) == 0);
            assert!(analytics::premium_subscribers(&counts) == 1);
            assert!(analytics::total_subscribers(&counts) == 1);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_multiple_subscriptions() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            // Record multiple subscriptions of different tiers
            analytics::record_subscription(&mut stats, subscription::create_tier_free());
            analytics::record_subscription(&mut stats, subscription::create_tier_free());
            analytics::record_subscription(&mut stats, subscription::create_tier_basic());
            analytics::record_subscription(&mut stats, subscription::create_tier_basic());
            analytics::record_subscription(&mut stats, subscription::create_tier_basic());
            analytics::record_subscription(&mut stats, subscription::create_tier_premium());

            let counts = analytics::get_subscriber_counts(&stats, &publisher_cap);
            assert!(analytics::free_subscribers(&counts) == 2);
            assert!(analytics::basic_subscribers(&counts) == 3);
            assert!(analytics::premium_subscribers(&counts) == 1);
            assert!(analytics::total_subscribers(&counts) == 6);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_revenue() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            // Record revenue
            analytics::record_revenue(&mut stats, 5_000_000_000); // 5 SUI

            let revenue = analytics::get_total_revenue(&stats, &publisher_cap);
            assert!(revenue == 5_000_000_000);

            // Record more revenue
            analytics::record_revenue(&mut stats, 10_000_000_000); // 10 SUI

            let revenue = analytics::get_total_revenue(&stats, &publisher_cap);
            assert!(revenue == 15_000_000_000);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_record_views() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            let article_id = object::id_from_address(@0x123);

            // Record views for an article
            analytics::record_view(&mut stats, article_id);
            analytics::record_view(&mut stats, article_id);
            analytics::record_view(&mut stats, article_id);

            let views = analytics::get_article_views(&stats, &publisher_cap, article_id);
            assert!(views == 3);

            // Record views for another article
            let article_id2 = object::id_from_address(@0x456);
            analytics::record_view(&mut stats, article_id2);

            let views2 = analytics::get_article_views(&stats, &publisher_cap, article_id2);
            assert!(views2 == 1);

            // First article views should be unchanged
            let views = analytics::get_article_views(&stats, &publisher_cap, article_id);
            assert!(views == 3);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_article_views_nonexistent() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            let article_id = object::id_from_address(@0x123);

            // Get views for article that hasn't been viewed
            let views = analytics::get_article_views(&stats, &publisher_cap, article_id);
            assert!(views == 0);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_full_analytics_flow() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication, publisher_cap) = publication::create_for_testing(ctx);

            let mut stats = analytics::create_stats(
                &publication,
                &publisher_cap,
                ctx
            );

            // Simulate a publication with multiple subscribers and revenue
            analytics::record_subscription(&mut stats, subscription::create_tier_free());
            analytics::record_subscription(&mut stats, subscription::create_tier_basic());
            analytics::record_revenue(&mut stats, 5_000_000_000);
            analytics::record_subscription(&mut stats, subscription::create_tier_premium());
            analytics::record_revenue(&mut stats, 15_000_000_000);
            analytics::record_subscription(&mut stats, subscription::create_tier_basic());
            analytics::record_revenue(&mut stats, 5_000_000_000);

            // Record article views
            let article1 = object::id_from_address(@0x111);
            let article2 = object::id_from_address(@0x222);
            analytics::record_view(&mut stats, article1);
            analytics::record_view(&mut stats, article1);
            analytics::record_view(&mut stats, article2);

            // Get full stats
            let (counts, revenue, _views) = analytics::get_stats(&stats, &publisher_cap);

            // Verify subscriber counts
            assert!(analytics::free_subscribers(&counts) == 1);
            assert!(analytics::basic_subscribers(&counts) == 2);
            assert!(analytics::premium_subscribers(&counts) == 1);
            assert!(analytics::total_subscribers(&counts) == 4);

            // Verify revenue
            assert!(revenue == 25_000_000_000); // 5 + 15 + 5 = 25 SUI

            // Verify views
            let views1 = analytics::get_article_views(&stats, &publisher_cap, article1);
            assert!(views1 == 2);
            let views2 = analytics::get_article_views(&stats, &publisher_cap, article2);
            assert!(views2 == 1);

            // Clean up
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = analytics::EInvalidPublicationId)]
    fun test_get_stats_wrong_cap() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (publication1, publisher_cap1) = publication::create_for_testing(ctx);
            let (publication2, publisher_cap2) = publication::create_for_testing(ctx);

            let stats = analytics::create_stats(
                &publication1,
                &publisher_cap1,
                ctx
            );

            // Try to get stats with wrong publisher cap
            let (_counts, _revenue, _views) = analytics::get_stats(&stats, &publisher_cap2);

            // Clean up - this code won't execute due to expected failure, but needed for compilation
            transfer::public_transfer(stats, creator);
            transfer::public_transfer(publication1, creator);
            transfer::public_transfer(publisher_cap1, creator);
            transfer::public_transfer(publication2, creator);
            transfer::public_transfer(publisher_cap2, creator);
        };

        test_scenario::end(scenario);
    }
}
