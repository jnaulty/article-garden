#[test_only]
module private_publishing::subscription_tests {
    use private_publishing::subscription::{Self};
    use private_publishing::publication;
    use private_publishing::treasury::{Self, Treasury};
    use sui::test_scenario;
    use sui::clock;
    use sui::coin;
    use sui::sui::SUI;
    use sui::kiosk;

    const BASIC_PRICE: u64 = 5_000_000_000; // 5 SUI
    const PREMIUM_PRICE: u64 = 15_000_000_000; // 15 SUI

    #[test]
    fun test_subscribe_basic_tier() {
        let creator = @0xCAFE;
        let subscriber = @0xBEEF;
        let mut scenario = test_scenario::begin(creator);

        // Create clock
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

            // Create payment
            let payment = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);

            // Subscribe with basic tier
            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            // Verify subscription
            assert!(subscription::publication_id(&subscription) == publication::id(&publication));
            assert!(subscription::tier_to_u8_public(&subscription::tier(&subscription)) == 1);
            assert!(subscription::subscriber(&subscription) == creator);
            assert!(subscription::is_valid(&subscription, &clock));

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, subscriber);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_subscribe_premium_tier() {
        let creator = @0xCAFE;
        let subscriber = @0xBEEF;
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

            let payment = coin::mint_for_testing<SUI>(PREMIUM_PRICE, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_premium(),
                payment,
                &clock,
                ctx
            );

            assert!(subscription::tier_to_u8_public(&subscription::tier(&subscription)) == 2);
            assert!(subscription::is_valid(&subscription, &clock));

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, subscriber);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_subscribe_free_tier() {
        let creator = @0xCAFE;
        let subscriber = @0xBEEF;
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

            let payment = coin::mint_for_testing<SUI>(0, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_free(),
                payment,
                &clock,
                ctx
            );

            assert!(subscription::tier_to_u8_public(&subscription::tier(&subscription)) == 0);
            assert!(subscription::is_valid(&subscription, &clock));

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, subscriber);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = subscription::EInsufficientPayment)]
    fun test_subscribe_insufficient_payment() {
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

            // Try to pay less than basic price
            let payment = coin::mint_for_testing<SUI>(1_000_000_000, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_renew_subscription() {
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

            let payment1 = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);

            let mut subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment1,
                &clock,
                ctx
            );

            let initial_expiry = subscription::expires_at(&subscription);

            // Advance time by 1 day
            clock::increment_for_testing(&mut clock, 86_400_000); // 1 day in ms

            // Renew subscription
            let payment2 = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);
            subscription::renew(
                &mut subscription,
                &publication,
                &mut treasury,
                payment2,
                &clock,
                ctx
            );

            // Verify expiry extended
            let new_expiry = subscription::expires_at(&subscription);
            assert!(new_expiry > initial_expiry);
            assert!(subscription::is_valid(&subscription, &clock));

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_kiosk_operations() {
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
            let (mut kiosk, kiosk_cap) = kiosk::new(ctx);

            let payment = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            let subscription_id = subscription::id(&subscription);

            // Place in kiosk
            subscription::place_in_kiosk(&mut kiosk, &kiosk_cap, subscription);

            // List for sale
            subscription::list_for_sale(&mut kiosk, &kiosk_cap, subscription_id, 6_000_000_000);

            // Take from kiosk (need to delist first in real scenario, but for test...)
            // Note: This would fail in real scenario without proper purchase flow

            // Clean up
            test_scenario::return_shared(treasury);
            transfer::public_share_object(kiosk);
            transfer::public_transfer(kiosk_cap, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_tier_access() {
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

            let payment = coin::mint_for_testing<SUI>(PREMIUM_PRICE, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_premium(),
                payment,
                &clock,
                ctx
            );

            // Premium subscription should have access to all tiers
            assert!(subscription::has_tier_access(&subscription, subscription::create_tier_free(), &clock));
            assert!(subscription::has_tier_access(&subscription, subscription::create_tier_basic(), &clock));
            assert!(subscription::has_tier_access(&subscription, subscription::create_tier_premium(), &clock));

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_subscription_expiry() {
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

            let payment = coin::mint_for_testing<SUI>(BASIC_PRICE, ctx);

            let subscription = subscription::subscribe(
                &mut publication,
                &mut treasury,
                subscription::create_tier_basic(),
                payment,
                &clock,
                ctx
            );

            assert!(subscription::is_valid(&subscription, &clock));

            // Advance time by 31 days (past expiry)
            clock::increment_for_testing(&mut clock, 31 * 86_400_000); // 31 days in ms

            // Subscription should be expired
            assert!(!subscription::is_valid(&subscription, &clock));

            test_scenario::return_shared(treasury);
            transfer::public_transfer(subscription, creator);
            transfer::public_transfer(publication, creator);
            transfer::public_transfer(publisher_cap, creator);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
