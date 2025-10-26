#[test_only]
module private_publishing::publication_tests {
    use private_publishing::publication;
    use sui::test_scenario;

    #[test]
    fun test_create_publication() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            // create_publication now returns only PublisherCap and shares the Publication
            let publisher_cap = publication::create_publication(
                b"Test Publication".to_string(),
                b"A test publication for unit tests".to_string(),
                5_000_000_000, // 5 SUI for basic
                15_000_000_000, // 15 SUI for premium
                true,           // free tier enabled
                ctx
            );

            transfer::public_transfer(publisher_cap, creator);
        };

        // In next transaction, retrieve the shared Publication object
        test_scenario::next_tx(&mut scenario, creator);
        {
            let publication = test_scenario::take_shared<publication::Publication>(&scenario);
            let publisher_cap = test_scenario::take_from_sender<publication::PublisherCap>(&scenario);

            // Verify publication fields
            assert!(publication::name(&publication) == b"Test Publication".to_string());
            assert!(publication::description(&publication) == b"A test publication for unit tests".to_string());
            assert!(publication::basic_price(&publication) == 5_000_000_000);
            assert!(publication::premium_price(&publication) == 15_000_000_000);
            assert!(publication::free_tier_enabled(&publication) == true);
            assert!(publication::article_count(&publication) == 0);
            assert!(publication::creator(&publication) == creator);

            // Verify publisher cap matches publication
            assert!(publication::publisher_cap_publication_id(&publisher_cap) == publication::id(&publication));

            test_scenario::return_shared(publication);
            test_scenario::return_to_sender(&scenario, publisher_cap);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_pricing() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);

            // Update pricing
            publication::update_pricing(
                &mut publication,
                &publisher_cap,
                10_000_000_000, // 10 SUI for basic
                25_000_000_000  // 25 SUI for premium
            );

            // Verify updated prices
            assert!(publication::basic_price(&publication) == 10_000_000_000);
            assert!(publication::premium_price(&publication) == 25_000_000_000);

            // Clean up
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = publication::EInvalidPrice)]
    fun test_update_pricing_invalid() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);

            // Try to set premium price lower than basic price
            publication::update_pricing(
                &mut publication,
                &publisher_cap,
                20_000_000_000, // 20 SUI for basic
                10_000_000_000  // 10 SUI for premium (invalid)
            );

            // Clean up
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_toggle_free_tier() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);

            assert!(publication::free_tier_enabled(&publication) == true);

            // Disable free tier
            publication::toggle_free_tier(&mut publication, &publisher_cap, false);
            assert!(publication::free_tier_enabled(&publication) == false);

            // Re-enable free tier
            publication::toggle_free_tier(&mut publication, &publisher_cap, true);
            assert!(publication::free_tier_enabled(&publication) == true);

            // Clean up
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_increment_article_count() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);

            assert!(publication::article_count(&publication) == 0);

            // Increment article count (package-internal function)
            publication::increment_article_count(&mut publication);
            assert!(publication::article_count(&publication) == 1);

            publication::increment_article_count(&mut publication);
            assert!(publication::article_count(&publication) == 2);

            // Clean up
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = publication::EInvalidPublicationId)]
    fun test_update_pricing_wrong_cap() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);

            let (mut publication1, publisher_cap1) = publication::create_for_testing(ctx);
            let (publication2, publisher_cap2) = publication::create_for_testing(ctx);

            // Try to update publication1 with publisher_cap2
            publication::update_pricing(
                &mut publication1,
                &publisher_cap2,
                10_000_000_000,
                25_000_000_000
            );

            // Clean up
            transfer::public_transfer(publication1, creator);
            transfer::public_transfer(publisher_cap1, creator);
            transfer::public_transfer(publication2, creator);
            transfer::public_transfer(publisher_cap2, creator);
        };
        test_scenario::end(scenario);
    }
}
