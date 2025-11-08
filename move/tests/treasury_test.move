#[test_only]
module private_publishing::treasury_test {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self};
    use sui::sui::SUI;
    use sui::clock::{Self};
    use private_publishing::treasury::{Self, Treasury, TreasuryCap};
    use private_publishing::publication::{Self, Publication, PublisherCap};
    use private_publishing::subscription::{Self};
    use private_publishing::article::{Self};

    const ALICE: address = @0xA11CE;
    const BOB: address = @0xB0B;

    fun setup_scenario(): Scenario {
        let scenario = ts::begin(ALICE);
        // Treasury will be initialized on first use
        scenario
    }

    #[test]
    fun test_subscription_fee_collection() {
        let mut scenario = setup_scenario();

        // Initialize treasury
        ts::next_tx(&mut scenario, ALICE);
        {
            treasury::init_for_testing(ts::ctx(&mut scenario));
        };

        // Create publication (now automatically shared)
        ts::next_tx(&mut scenario, ALICE);
        {
            let publisher_cap = publication::create_publication(
                b"Test Blog".to_string(),
                b"A test publication".to_string(),
                1_000_000_000, // 1 SUI basic
                2_000_000_000, // 2 SUI premium
                false,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(publisher_cap, ALICE);
        };

        // Bob subscribes with treasury fee
        ts::next_tx(&mut scenario, BOB);
        {
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            let publication = ts::take_shared<Publication>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            // Create payment (2 SUI for premium)
            let payment = coin::mint_for_testing<SUI>(2_000_000_000, ts::ctx(&mut scenario));

            // Subscribe (should collect 1% fee = 20_000_000 MIST)
            let subscription = subscription::subscribe(
                &publication,
                &mut treasury,
                subscription::create_tier_premium(),
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            // Verify treasury collected fee (1% of 2 SUI = 0.02 SUI)
            assert!(treasury::balance(&treasury) == 20_000_000, 0);
            assert!(treasury::total_fees_collected(&treasury) == 20_000_000, 1);

            transfer::public_transfer(subscription, BOB);
            ts::return_shared(treasury);
            ts::return_shared(publication);
            clock::destroy_for_testing(clock);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_article_deposit_collection() {
        let mut scenario = setup_scenario();

        // Initialize treasury
        ts::next_tx(&mut scenario, ALICE);
        {
            treasury::init_for_testing(ts::ctx(&mut scenario));
        };

        // Create publication (now automatically shared)
        ts::next_tx(&mut scenario, ALICE);
        {
            let publisher_cap = publication::create_publication(
                b"Test Blog".to_string(),
                b"A test publication".to_string(),
                1_000_000_000, // 1 SUI basic
                3_000_000_000, // 3 SUI premium
                false,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(publisher_cap, ALICE);
        };

        // Alice publishes article with deposit
        ts::next_tx(&mut scenario, ALICE);
        {
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            let mut publication = ts::take_shared<Publication>(&scenario);
            let publisher_cap = ts::take_from_sender<PublisherCap>(&scenario);

            // Create deposit (1% of 3 SUI premium = 0.03 SUI)
            let deposit = coin::mint_for_testing<SUI>(30_000_000, ts::ctx(&mut scenario));

            // Publish article (automatically shares it)
            article::publish_article(
                &mut publication,
                &mut treasury,
                &publisher_cap,
                b"Test Article".to_string(),
                b"An excerpt".to_string(),
                b"walrus_blob_123".to_string(),
                b"seal_key_123",
                subscription::create_tier_premium(),
                1234567890,
                deposit,
                ts::ctx(&mut scenario)
            );

            // Verify treasury collected deposit
            assert!(treasury::balance(&treasury) == 30_000_000, 0);
            assert!(treasury::total_deposits_collected(&treasury) == 30_000_000, 1);

            ts::return_to_sender(&scenario, publisher_cap);
            ts::return_shared(treasury);
            ts::return_shared(publication);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_treasury_withdrawal() {
        let mut scenario = setup_scenario();

        // Initialize treasury
        ts::next_tx(&mut scenario, ALICE);
        {
            treasury::init_for_testing(ts::ctx(&mut scenario));
        };

        // Setup treasury with some balance
        ts::next_tx(&mut scenario, ALICE);
        {
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            let treasury_cap = ts::take_from_sender<TreasuryCap>(&scenario);

            // Add some funds to treasury (simulate fees collected)
            let payment = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            treasury::collect_article_deposit(
                &mut treasury,
                payment,
                object::id_from_address(@0x123),
                ALICE
            );

            // Withdraw half
            treasury::withdraw(
                &mut treasury,
                &treasury_cap,
                50_000_000,
                ALICE,
                ts::ctx(&mut scenario)
            );

            // Verify remaining balance
            assert!(treasury::balance(&treasury) == 50_000_000, 0);

            ts::return_to_sender(&scenario, treasury_cap);
            ts::return_shared(treasury);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_fee_calculation() {
        // Test 1% fee calculation
        let fee = treasury::calculate_fee_public(1_000_000_000, 100); // 1 SUI, 100 bps
        assert!(fee == 10_000_000, 0); // 0.01 SUI

        // Test 0.5% fee calculation
        let fee = treasury::calculate_fee_public(2_000_000_000, 50); // 2 SUI, 50 bps
        assert!(fee == 10_000_000, 1); // 0.01 SUI

        // Test edge cases
        let fee = treasury::calculate_fee_public(0, 100);
        assert!(fee == 0, 2);

        let fee = treasury::calculate_fee_public(100, 0);
        assert!(fee == 0, 3);
    }
}

