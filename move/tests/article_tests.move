#[test_only]
module private_publishing::article_tests {
    use private_publishing::article;
    use private_publishing::publication;
    use private_publishing::subscription;
    use private_publishing::treasury::{Self, Treasury};
    use sui::test_scenario;
    use sui::clock;
    use sui::coin;
    use sui::sui::SUI;

    #[test]
    fun test_publish_article() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let published_at;
        let publication_id;
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);

            let initial_count = publication::article_count(&publication);
            published_at = clock::timestamp_ms(&clock) / 1000;
            publication_id = publication::id(&publication);

            // Create deposit (15 SUI premium price, 1% = 0.15 SUI)
            let deposit = coin::mint_for_testing<SUI>(150_000_000, ctx);

            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"This is a test article excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            // Verify article count incremented
            assert!(publication::article_count(&publication) == initial_count + 1);

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Take the shared article and verify its fields
        test_scenario::next_tx(&mut scenario, creator);
        {
            let article = test_scenario::take_shared(&scenario);

            // Verify article fields
            assert!(article::title(&article) == b"Test Article".to_string());
            assert!(article::excerpt(&article) == b"This is a test article excerpt".to_string());
            assert!(article::walrus_blob_id(&article) == b"walrus_blob_123".to_string());
            assert!(article::seal_key_id(&article) == b"seal_key_456");
            assert!(article::published_at(&article) == published_at);
            assert!(!article::is_archived(&article));
            assert!(article::publication_id(&article) == publication_id);

            test_scenario::return_shared(article);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_article() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        // Initialize treasury
        test_scenario::next_tx(&mut scenario, creator);
        {
            treasury::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        let published_at;
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
            published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(150_000_000, ctx);

            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Original Title".to_string(),
                b"Original excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_456",
                subscription::create_tier_basic(),
                published_at,
                deposit,
                ctx
            );

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Update the shared article
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut article = test_scenario::take_shared(&scenario);
            let publisher_cap = test_scenario::take_from_sender(&scenario);

            // Update article
            article::update_article(
                &mut article,
                &publisher_cap,
                b"Updated Title".to_string(),
                b"Updated excerpt".to_string()
            );

            // Verify updates
            assert!(article::title(&article) == b"Updated Title".to_string());
            assert!(article::excerpt(&article) == b"Updated excerpt".to_string());

            // Verify immutable fields unchanged
            assert!(article::walrus_blob_id(&article) == b"walrus_blob_123".to_string());
            assert!(article::published_at(&article) == published_at);

            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publisher_cap);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_archive_article() {
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

            let deposit = coin::mint_for_testing<SUI>(150_000_000, ctx);

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
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        // Test archive/unarchive on the shared article
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut article = test_scenario::take_shared(&scenario);
            let publisher_cap = test_scenario::take_from_sender(&scenario);

            assert!(!article::is_archived(&article));

            // Archive article
            article::archive_article(&mut article, &publisher_cap);
            assert!(article::is_archived(&article));

            // Unarchive article
            article::unarchive_article(&mut article, &publisher_cap);
            assert!(!article::is_archived(&article));

            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publisher_cap);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = article::EInvalidPublicationId)]
    fun test_publish_article_wrong_cap() {
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
            let (mut publication1, publisher_cap1) = publication::create_for_testing(ctx);
            let (publication2, publisher_cap2) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(150_000_000, ctx);

            // Try to publish to publication1 with publisher_cap2 - should abort
            article::publish_article(
                &mut publication1,
                &mut treasury,
                &publisher_cap2,
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
            transfer::public_transfer(publication1, creator);
            transfer::public_transfer(publisher_cap1, creator);
            transfer::public_transfer(publication2, creator);
            transfer::public_transfer(publisher_cap2, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = article::EInvalidPublicationId)]
    fun test_update_article_wrong_cap() {
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
            let (mut publication1, publisher_cap1) = publication::create_for_testing(ctx);
            let (_publication2, publisher_cap2) = publication::create_for_testing(ctx);
            let published_at = clock::timestamp_ms(&clock) / 1000;

            let deposit = coin::mint_for_testing<SUI>(150_000_000, ctx);

            article::publish_article(
                &mut publication1,
                &mut treasury,
                &publisher_cap1,
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
            transfer::public_transfer(publication1, creator);
            transfer::public_transfer(_publication2, creator);
            transfer::public_transfer(publisher_cap1, creator);
            transfer::public_transfer(publisher_cap2, creator);
        };

        // Try to update with wrong cap - should abort
        test_scenario::next_tx(&mut scenario, creator);
        {
            let mut article = test_scenario::take_shared(&scenario);
            let publisher_cap2 = test_scenario::take_from_sender(&scenario);

            article::update_article(
                &mut article,
                &publisher_cap2,
                b"Updated Title".to_string(),
                b"Updated excerpt".to_string()
            );

            test_scenario::return_shared(article);
            test_scenario::return_to_sender(&scenario, publisher_cap2);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_multiple_articles() {
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

            assert!(publication::article_count(&publication) == 0);

            // Publish first article
            let deposit1 = coin::mint_for_testing<SUI>(150_000_000, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Article 1".to_string(),
                b"First article".to_string(),
                b"blob_1".to_string(),
                b"key_1",
                subscription::create_tier_free(),
                published_at,
                deposit1,
                ctx
            );
            assert!(publication::article_count(&publication) == 1);

            // Publish second article
            let deposit2 = coin::mint_for_testing<SUI>(150_000_000, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Article 2".to_string(),
                b"Second article".to_string(),
                b"blob_2".to_string(),
                b"key_2",
                subscription::create_tier_basic(),
                published_at,
                deposit2,
                ctx
            );
            assert!(publication::article_count(&publication) == 2);

            // Publish third article
            let deposit3 = coin::mint_for_testing<SUI>(150_000_000, ctx);
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Article 3".to_string(),
                b"Third article".to_string(),
                b"blob_3".to_string(),
                b"key_3",
                subscription::create_tier_premium(),
                published_at,
                deposit3,
                ctx
            );
            assert!(publication::article_count(&publication) == 3);

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
