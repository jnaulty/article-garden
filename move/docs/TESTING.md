# Testing Guide

Comprehensive testing strategies for the private publishing smart contracts.

## Table of Contents

- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)

---

## Unit Testing

### Running Tests

```bash
# Run all tests
cd move/
sui move test

# Run specific module tests
sui move test publication_tests

# Run with verbose output
sui move test --verbose

# Run with gas profiling
sui move test --gas-profiler

# Run with coverage
sui move test --coverage
```

### Test Structure

Tests are located in `move/tests/` directory:

```
tests/
├── publication_tests.move
├── subscription_tests.move
├── article_tests.move
├── access_control_tests.move
├── marketplace_policies_tests.move
└── analytics_tests.move
```

### Treasury Module Testing

#### Testing Treasury Initialization

```move
#[test_only]
module private_publishing::treasury_test {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use private_publishing::treasury::{Self, Treasury, TreasuryCap};

    const ADMIN: address = @0xAD;
    const USER: address = @0xUSER;

    #[test]
    fun test_treasury_initialization() {
        let mut scenario = test::begin(ADMIN);

        // Initialize treasury
        {
            treasury::init_for_testing(ctx(&mut scenario));
        };

        // Verify treasury was created
        next_tx(&mut scenario, ADMIN);
        {
            let treasury = test::take_shared<Treasury>(&mut scenario);
            let treasury_cap = test::take_from_sender<TreasuryCap>(&mut scenario);

            // Check initial state
            assert!(treasury::balance(&treasury) == 0);
            assert!(treasury::subscription_fee_bps(&treasury) == 100); // 1%
            assert!(treasury::article_deposit_bps(&treasury) == 100); // 1%

            test::return_shared(treasury);
            test::return_to_sender(&mut scenario, treasury_cap);
        };

        test::end(scenario);
    }

    #[test]
    fun test_collect_subscription_fee() {
        let mut scenario = test::begin(ADMIN);

        // Setup
        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));
        let publication_id = object::id_from_address(@0x123);

        // Simulate subscription payment
        {
            let payment_amount = 5_000_000_000u64; // 5 SUI
            let mut payment = coin::mint_for_testing<SUI>(payment_amount, ctx(&mut scenario));

            // Collect fee
            let remaining = treasury::collect_subscription_fee(
                &mut treasury,
                &mut payment,
                publication_id,
                USER,
                ctx(&mut scenario)
            );

            // Verify fee collected (1% of 5 SUI = 0.05 SUI)
            let expected_fee = 50_000_000u64;
            let expected_remaining = payment_amount - expected_fee;

            assert!(remaining == expected_remaining);
            assert!(treasury::balance(&treasury) == expected_fee);
            assert!(treasury::total_fees_collected(&treasury) == expected_fee);

            // Verify payment coin value reduced by fee
            assert!(coin::value(&payment) == expected_remaining);

            coin::burn_for_testing(payment);
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_collect_article_deposit() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));
        let publication_id = object::id_from_address(@0x123);

        {
            let deposit_amount = 150_000_000u64; // 0.15 SUI
            let deposit = coin::mint_for_testing<SUI>(deposit_amount, ctx(&mut scenario));

            // Collect deposit
            treasury::collect_article_deposit(
                &mut treasury,
                deposit,
                publication_id,
                USER,
            );

            // Verify deposit collected
            assert!(treasury::balance(&treasury) == deposit_amount);
            assert!(treasury::total_deposits_collected(&treasury) == deposit_amount);
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = treasury::EZeroAmount)]
    fun test_collect_zero_deposit_fails() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));
        let publication_id = object::id_from_address(@0x123);

        {
            let deposit = coin::mint_for_testing<SUI>(0, ctx(&mut scenario));

            // Should fail with EZeroAmount
            treasury::collect_article_deposit(
                &mut treasury,
                deposit,
                publication_id,
                USER,
            );
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_withdraw() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));

        // Add funds to treasury
        {
            let deposit = coin::mint_for_testing<SUI>(100_000_000_000, ctx(&mut scenario));
            treasury::collect_article_deposit(
                &mut treasury,
                deposit,
                object::id_from_address(@0x123),
                USER,
            );
        };

        next_tx(&mut scenario, ADMIN);
        {
            let initial_balance = treasury::balance(&treasury);

            // Withdraw
            let withdraw_amount = 50_000_000_000u64; // 50 SUI
            treasury::withdraw(
                &mut treasury,
                &treasury_cap,
                withdraw_amount,
                ADMIN,
                ctx(&mut scenario)
            );

            // Verify withdrawal
            assert!(treasury::balance(&treasury) == initial_balance - withdraw_amount);
        };

        // Verify coin received
        next_tx(&mut scenario, ADMIN);
        {
            let coin = test::take_from_sender<Coin<SUI>>(&mut scenario);
            assert!(coin::value(&coin) == 50_000_000_000);
            test::return_to_sender(&mut scenario, coin);
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = treasury::EInsufficientBalance)]
    fun test_withdraw_insufficient_balance_fails() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));

        {
            // Try to withdraw more than balance
            treasury::withdraw(
                &mut treasury,
                &treasury_cap,
                100_000_000_000, // 100 SUI
                ADMIN,
                ctx(&mut scenario)
            );
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_update_fee_rates() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));

        {
            // Update fees to 2% (200 BPS)
            treasury::update_fee_rates(
                &mut treasury,
                &treasury_cap,
                200, // 2% subscription fee
                200, // 2% article deposit
            );

            // Verify updated
            assert!(treasury::subscription_fee_bps(&treasury) == 200);
            assert!(treasury::article_deposit_bps(&treasury) == 200);
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = treasury::EInvalidFeeRate)]
    fun test_update_fee_rates_too_high_fails() {
        let mut scenario = test::begin(ADMIN);

        let (mut treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));

        {
            // Try to set fee > 10% (1000 BPS)
            treasury::update_fee_rates(
                &mut treasury,
                &treasury_cap,
                1001, // 10.01% - too high!
                100,
            );
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_calculate_article_deposit() {
        let mut scenario = test::begin(ADMIN);

        let (treasury, treasury_cap) = treasury::create_for_testing(ctx(&mut scenario));

        {
            let premium_price = 15_000_000_000u64; // 15 SUI

            // Calculate deposit (should be 1% = 0.15 SUI)
            let deposit = treasury::calculate_article_deposit(&treasury, premium_price);

            assert!(deposit == 150_000_000); // 0.15 SUI in MIST
        };

        treasury::destroy_for_testing(treasury);
        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_calculate_fee_public() {
        // Test fee calculation helper
        let amount = 5_000_000_000u64; // 5 SUI
        let fee_bps = 100u64; // 1%

        let fee = treasury::calculate_fee_public(amount, fee_bps);

        assert!(fee == 50_000_000); // 0.05 SUI
    }
}
```

### Example Unit Test

```move
#[test_only]
module private_publishing::publication_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use private_publishing::publication::{Self, Publication, PublisherCap};

    const CREATOR: address = @0xC001;

    #[test]
    fun test_create_publication() {
        let mut scenario = test::begin(CREATOR);

        // Create publication
        {
            let (publication, publisher_cap) = publication::create_publication(
                b"Test Pub".to_string(),
                b"Description".to_string(),
                5_000_000_000, // 5 SUI basic
                15_000_000_000, // 15 SUI premium
                true, // free tier enabled
                ctx(&mut scenario)
            );

            // Verify fields
            assert!(publication::name(&publication) == b"Test Pub".to_string());
            assert!(publication::creator(&publication) == CREATOR);
            assert!(publication::basic_price(&publication) == 5_000_000_000);
            assert!(publication::free_tier_enabled(&publication) == true);

            // Transfer to sender
            transfer::public_transfer(publication, CREATOR);
            transfer::public_transfer(publisher_cap, CREATOR);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = publication::EInvalidPrice)]
    fun test_create_publication_invalid_price() {
        let mut scenario = test::begin(CREATOR);

        {
            // Premium price less than basic should fail
            let (publication, publisher_cap) = publication::create_publication(
                b"Test".to_string(),
                b"Test".to_string(),
                15_000_000_000, // basic
                5_000_000_000,  // premium (invalid!)
                true,
                ctx(&mut scenario)
            );

            transfer::public_transfer(publication, CREATOR);
            transfer::public_transfer(publisher_cap, CREATOR);
        };

        test::end(scenario);
    }

    #[test]
    fun test_update_pricing() {
        let mut scenario = test::begin(CREATOR);

        // Create publication
        let publication_id;
        let publisher_cap_id;
        {
            let (publication, publisher_cap) = publication::create_publication(
                b"Test".to_string(),
                b"Test".to_string(),
                5_000_000_000,
                15_000_000_000,
                true,
                ctx(&mut scenario)
            );

            publication_id = object::id(&publication);
            publisher_cap_id = object::id(&publisher_cap);

            transfer::public_share_object(publication);
            transfer::public_transfer(publisher_cap, CREATOR);
        };

        // Update pricing
        next_tx(&mut scenario, CREATOR);
        {
            let mut publication = test::take_shared_by_id<Publication>(
                &mut scenario,
                publication_id
            );
            let publisher_cap = test::take_from_sender<PublisherCap>(&mut scenario);

            publication::update_pricing(
                &mut publication,
                &publisher_cap,
                10_000_000_000, // new basic
                20_000_000_000, // new premium
            );

            assert!(publication::basic_price(&publication) == 10_000_000_000);
            assert!(publication::premium_price(&publication) == 20_000_000_000);

            test::return_shared(publication);
            test::return_to_sender(&mut scenario, publisher_cap);
        };

        test::end(scenario);
    }
}
```

### Testing Patterns

#### Test Scenario Flow

```move
// 1. Begin scenario
let mut scenario = test::begin(CREATOR);

// 2. First transaction - create objects
{
    let obj = create_object(ctx(&mut scenario));
    transfer::public_transfer(obj, CREATOR);
};

// 3. Next transaction - use objects
next_tx(&mut scenario, CREATOR);
{
    let obj = test::take_from_sender<MyObject>(&mut scenario);
    // Use obj
    test::return_to_sender(&mut scenario, obj);
};

// 4. End scenario
test::end(scenario);
```

#### Testing Shared Objects

```move
// Take shared object
let mut publication = test::take_shared_by_id<Publication>(
    &mut scenario,
    publication_id
);

// Use it
publication::update_pricing(&mut publication, ...);

// Return it
test::return_shared(publication);
```

#### Testing Clock

```move
// Create test clock
let clock = clock::create_for_testing(ctx(&mut scenario));

// Set timestamp
clock::set_for_testing(&mut clock, 1000000);

// Use in function
subscription::is_valid(&subscription, &clock);

// Destroy
clock::destroy_for_testing(clock);
```

#### Testing Failures

```move
#[test]
#[expected_failure(abort_code = EInsufficientPayment)]
fun test_insufficient_payment() {
    // Test code that should fail
}
```

---

## Integration Testing

### E2E Test Setup

Located in `move/e2e-tests/`:

```bash
cd move/e2e-tests/
npm install
npm test
```

### TypeScript Test Example

```typescript
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui/transactions';

describe('Publication E2E Tests', () => {
  let client: SuiClient;
  let packageId: string;

  before(async () => {
    client = new SuiClient({ url: getFullnodeUrl('localnet') });

    // Deploy package (or use existing)
    packageId = process.env.PACKAGE_ID!;
  });

  it('should create publication', async () => {
    const txb = new TransactionBlock();

    const [publication, publisherCap] = txb.moveCall({
      target: `${packageId}::publication::create_publication`,
      arguments: [
        txb.pure.string('Test Publication'),
        txb.pure.string('Test Description'),
        txb.pure.u64(5_000_000_000n),
        txb.pure.u64(15_000_000_000n),
        txb.pure.bool(true),
      ],
    });

    const result = await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: keypair,
    });

    expect(result.effects?.status.status).to.equal('success');

    // Extract created object IDs
    const created = result.effects?.created || [];
    expect(created.length).to.be.greaterThan(0);
  });

  it('should subscribe to publication', async () => {
    const txb = new TransactionBlock();

    const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(5_000_000_000n)]);

    const [subscription] = txb.moveCall({
      target: `${packageId}::subscription::subscribe`,
      arguments: [
        txb.object(publicationId),
        txb.pure.u8(1), // Basic tier
        coin,
        txb.object('0x6'), // Clock
      ],
    });

    const result = await client.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      signer: keypair,
    });

    expect(result.effects?.status.status).to.equal('success');
  });

  it('should verify subscription access', async () => {
    // Test access verification
    const hasAccess = await verifySubscriptionAccess(subscriptionId, articleId);
    expect(hasAccess).to.be.true;
  });
});
```

### Full User Flow Test

```typescript
describe('Complete User Journey', () => {
  it('should complete writer workflow', async () => {
    // 1. Create publication
    const { publicationId, publisherCapId } = await createPublication({
      name: 'Tech Weekly',
      basicPrice: 5_000_000_000n,
    });

    // 2. Create analytics
    const statsId = await createStats(publicationId, publisherCapId);

    // 3. Publish article
    const articleId = await publishArticle({
      publicationId,
      publisherCapId,
      title: 'First Article',
      content: 'Content here',
      tier: Tier.Basic,
    });

    // 4. Verify article created
    const article = await getArticle(articleId);
    expect(article.title).to.equal('First Article');
  });

  it('should complete subscription with treasury fees', async () => {
    // Complete subscription flow including treasury
    const publication = await getPublication(publicationId);
    const basicPrice = BigInt(publication.basicPrice);

    // Subscribe with treasury fee collection
    const result = await subscribeWithTreasuryFee({
      publicationId,
      treasuryId: TREASURY_ID,
      tier: Tier.Basic,
      paymentAmount: basicPrice,
    });

    expect(result.effects?.status.status).to.equal('success');

    // Verify treasury collected fee
    const treasuryStats = await getTreasuryStats(TREASURY_ID);
    expect(treasuryStats.totalFeesCollected).to.be.greaterThan(0n);

    // Calculate expected fee (1% of basicPrice)
    const expectedFee = basicPrice / 100n;
    expect(treasuryStats.totalFeesCollected).to.equal(expectedFee);
  });

  it('should publish article with deposit', async () => {
    const publication = await getPublication(publicationId);
    const premiumPrice = BigInt(publication.premiumPrice);

    // Calculate required deposit
    const deposit = await calculateArticleDeposit(TREASURY_ID, premiumPrice);

    // Publish with deposit
    const result = await publishArticleWithDeposit({
      publicationId,
      publisherCapId,
      treasuryId: TREASURY_ID,
      premiumPrice,
      title: 'Test Article',
      excerpt: 'Test excerpt',
      walrusBlobId: 'test_blob',
      sealKeyId: new Uint8Array([1, 2, 3]),
      tier: Tier.Premium,
    });

    expect(result.effects?.status.status).to.equal('success');

    // Verify deposit collected
    const treasuryStats = await getTreasuryStats(TREASURY_ID);
    expect(treasuryStats.totalDepositsCollected).to.equal(deposit);
  });

  it('should complete reader workflow', async () => {
    // 1. Browse publications
    const publications = await getPublications();
    expect(publications.length).to.be.greaterThan(0);

    // 2. Subscribe
    const subscriptionId = await subscribe({
      publicationId: publications[0].id,
      tier: Tier.Basic,
      payment: 5_000_000_000n,
    });

    // 3. Access article
    const content = await readArticle(articleId, subscriptionId);
    expect(content).to.not.be.empty;

    // 4. Verify stats updated
    const stats = await getStats(statsId, publisherCapId);
    expect(stats.subscribers.basic).to.equal(1);
  });
});
```

---

## Test Coverage

### Generate Coverage Report

```bash
sui move test --coverage

# View coverage summary
cat coverage/summary.txt

# Detailed module coverage
cat coverage/source_coverage/publication.move
```

### Coverage Goals

**Target Coverage:**
- Overall: >90%
- Critical modules (publication, subscription, access_control): >95%
- Helper functions: >80%

**Uncovered Code Should Be:**
- Unreachable error paths
- Test-only functions
- Documented edge cases

### Example Coverage Output

```
Module: publication
  Lines: 95/100 (95%)
  Functions: 12/12 (100%)
  Branches: 18/20 (90%)

Module: subscription
  Lines: 88/90 (97.8%)
  Functions: 15/15 (100%)
  Branches: 22/24 (91.7%)
```

---

## Best Practices

### 1. Test Organization

```move
#[test_only]
module private_publishing::publication_tests {
    // Imports
    use private_publishing::publication;

    // Constants
    const CREATOR: address = @0xC001;
    const USER: address = @0xU5E4;

    // Happy path tests
    #[test]
    fun test_create_publication() { ... }

    #[test]
    fun test_update_pricing() { ... }

    // Failure tests
    #[test]
    #[expected_failure(abort_code = EInvalidPrice)]
    fun test_invalid_price() { ... }

    // Edge case tests
    #[test]
    fun test_zero_price() { ... }

    // Helper functions
    fun setup_publication(scenario: &mut Scenario): ID { ... }
}
```

### 2. Test Naming

```move
// Good names
test_create_publication()
test_subscribe_basic_tier()
test_invalid_publisher_cap()

// Bad names
test1()
test_publication()
my_test()
```

### 3. Assertions

```move
// Use specific assertions
assert!(publication::name(&pub) == b"Test".to_string());
assert!(subscription::is_valid(&sub, &clock) == true);

// Document why
assert!(
    publication::basic_price(&pub) >= 0,
    0 // Custom error code for tests
);
```

### 4. Test Independence

```move
// Each test should be independent
#[test]
fun test_a() {
    let mut scenario = test::begin(CREATOR);
    // Test A logic
    test::end(scenario);
}

#[test]
fun test_b() {
    // Don't depend on test_a
    let mut scenario = test::begin(CREATOR);
    // Test B logic
    test::end(scenario);
}
```

### 5. Test Data

```move
// Use constants for test data
const TEST_BASIC_PRICE: u64 = 5_000_000_000;
const TEST_PREMIUM_PRICE: u64 = 15_000_000_000;

// Use descriptive addresses
const CREATOR: address = @0xC001;
const SUBSCRIBER: address = @0x5005;
const THIRD_PARTY: address = @0x7444D;
```

---

## Regression Testing

### After Bug Fixes

```move
// Document the bug and fix
#[test]
fun test_fix_expired_subscription_renewal() {
    // Bug: Expired subscriptions couldn't be renewed
    // Fix: Check expiry and extend from now if expired

    let mut scenario = test::begin(CREATOR);

    // Setup: Create expired subscription
    let clock = clock::create_for_testing(ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 0);

    // ... create subscription

    // Advance time to expire
    clock::set_for_testing(&mut clock, 3_000_000_000);

    // Renew should work
    subscription::renew(&mut sub, &pub, payment, &clock, ctx(&mut scenario));

    assert!(subscription::is_valid(&sub, &clock));

    clock::destroy_for_testing(clock);
    test::end(scenario);
}
```

---

## Performance Testing

### Gas Usage

```bash
# Profile gas usage
sui move test --gas-profiler

# Example output:
# Function                           Gas Used
# publication::create_publication    1,234,567
# subscription::subscribe            987,654
# article::publish_article           2,345,678
```

### Optimization Checks

```move
#[test]
fun test_gas_efficient_batch_subscribe() {
    // Test that batching is cheaper than individual calls
    // Compare gas for 10 individual vs 1 batch
}
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Move Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Sui
        run: cargo install --git https://github.com/MystenLabs/sui.git --branch main sui

      - name: Run tests
        run: |
          cd move
          sui move test --coverage

      - name: Check coverage
        run: |
          cd move
          coverage=$(cat coverage/summary.txt | grep "Overall" | awk '{print $2}')
          if [ $(echo "$coverage < 90" | bc) -eq 1 ]; then
            echo "Coverage too low: $coverage%"
            exit 1
          fi
```

---

## Debugging Tests

### Verbose Output

```bash
sui move test --verbose

# Shows:
# - Transaction inputs
# - Object changes
# - Event emissions
# - Gas usage
```

### Print Debugging

```move
#[test]
fun test_with_debug() {
    use std::debug;

    let value = 123;
    debug::print(&value);

    let string = b"Test".to_string();
    debug::print(&string);
}
```

### Test Isolation

```bash
# Run single test
sui move test test_create_publication

# Run with filter
sui move test --filter "publication"
```

---

## See Also

- [Module API](./MODULE_API.md) - Function signatures
- [Integration Guide](./INTEGRATION_GUIDE.md) - E2E examples
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deploy and test
- [Security Guide](./SECURITY.md) - Security testing
