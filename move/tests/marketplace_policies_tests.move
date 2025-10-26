#[test_only]
module private_publishing::marketplace_policies_tests {
    use private_publishing::marketplace_policies;
    use sui::test_scenario;

    #[test]
    fun test_add_royalty_rule() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add royalty rule with 10% royalty
            marketplace_policies::add_royalty_rule(
                &mut policy,
                &cap,
                1_000, // 10% in basis points
                0      // No minimum amount
            );

            // Verify rule was added
            let royalty_bp = marketplace_policies::royalty_bp(&policy);
            assert!(royalty_bp == 1_000);

            let min_amount = marketplace_policies::min_royalty_amount(&policy);
            assert!(min_amount == 0);

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_calculate_royalty_amount_percentage() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add 10% royalty rule
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 1_000, 0);

            // Calculate royalty on 100 SUI sale
            let sale_price = 100_000_000_000; // 100 SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);

            // Should be 10 SUI (10%)
            assert!(royalty == 10_000_000_000);

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_calculate_royalty_amount_minimum() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add 10% royalty rule with 5 SUI minimum
            marketplace_policies::add_royalty_rule(
                &mut policy,
                &cap,
                1_000,             // 10%
                5_000_000_000      // 5 SUI minimum
            );

            // Calculate royalty on 10 SUI sale (10% = 1 SUI, but minimum is 5 SUI)
            let sale_price = 10_000_000_000; // 10 SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);

            // Should be 5 SUI (minimum)
            assert!(royalty == 5_000_000_000);

            // Calculate royalty on 100 SUI sale (10% = 10 SUI, higher than minimum)
            let sale_price = 100_000_000_000; // 100 SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);

            // Should be 10 SUI (percentage)
            assert!(royalty == 10_000_000_000);

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_calculate_royalty_different_percentages() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Test 5% royalty
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 500, 0);

            let sale_price = 100_000_000_000; // 100 SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
            assert!(royalty == 5_000_000_000); // 5 SUI

            // Remove and add 25% royalty
            marketplace_policies::remove_royalty_rule(&mut policy, &cap);
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 2_500, 0);

            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
            assert!(royalty == 25_000_000_000); // 25 SUI

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = marketplace_policies::ERoyaltyTooHigh)]
    fun test_add_royalty_rule_too_high() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Try to add royalty rule > 100%
            marketplace_policies::add_royalty_rule(
                &mut policy,
                &cap,
                10_001, // 100.01%
                0
            );

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_remove_royalty_rule() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add royalty rule
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 1_000, 0);

            // Remove royalty rule
            marketplace_policies::remove_royalty_rule(&mut policy, &cap);

            // After removal, trying to get royalty should fail
            // (This would typically fail with a missing rule error)

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_default_royalty_bps() {
        let default_bps = marketplace_policies::default_royalty_bps();
        assert!(default_bps == 1_000); // Should be 10%
    }

    #[test]
    fun test_royalty_calculation_edge_cases() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add 10% royalty with no minimum
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 1_000, 0);

            // Test very small sale price
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, 1_000);
            assert!(royalty == 100); // 10% of 1000

            // Test zero sale price
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, 0);
            assert!(royalty == 0);

            // Test large sale price
            let large_price = 1_000_000_000_000_000; // 1 million SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, large_price);
            assert!(royalty == 100_000_000_000_000); // 100k SUI

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_royalty_with_fractional_basis_points() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            // Add 2.5% royalty (250 basis points)
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 250, 0);

            let sale_price = 100_000_000_000; // 100 SUI
            let royalty = marketplace_policies::calculate_royalty_amount(&policy, sale_price);

            // Should be 2.5 SUI
            assert!(royalty == 2_500_000_000);

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_multiple_rule_updates() {
        let creator = @0xCAFE;
        let mut scenario = test_scenario::begin(creator);

        test_scenario::next_tx(&mut scenario, creator);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let (mut policy, cap) = marketplace_policies::create_test_policy(ctx);

            let sale_price = 100_000_000_000; // 100 SUI

            // Add 10% royalty
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 1_000, 0);
            let royalty1 = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
            assert!(royalty1 == 10_000_000_000);

            // Remove and add 5% royalty
            marketplace_policies::remove_royalty_rule(&mut policy, &cap);
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 500, 0);
            let royalty2 = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
            assert!(royalty2 == 5_000_000_000);

            // Remove and add 15% royalty
            marketplace_policies::remove_royalty_rule(&mut policy, &cap);
            marketplace_policies::add_royalty_rule(&mut policy, &cap, 1_500, 0);
            let royalty3 = marketplace_policies::calculate_royalty_amount(&policy, sale_price);
            assert!(royalty3 == 15_000_000_000);

            // Clean up
            transfer::public_transfer(cap, creator);
            transfer::public_share_object(policy);
        };

        test_scenario::end(scenario);
    }
}
