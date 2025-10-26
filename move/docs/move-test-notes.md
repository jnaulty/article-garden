# Move Test Writing Best Practices and Common Issues

This document outlines best practices and common issues encountered when writing Move tests, particularly for Sui Move projects. These notes are based on real debugging experience with the private-publishing project.

## Table of Contents
- [Common Compilation Errors](#common-compilation-errors)
- [Resource Management](#resource-management)
- [Test Scenario Patterns](#test-scenario-patterns)
- [Function Parameter Changes](#function-parameter-changes)
- [Best Practices](#best-practices)

## Common Compilation Errors

### 1. Referential Transparency Violations

**Error**: `error[E07001]: referential transparency violated`

**Cause**: Trying to use both mutable and immutable references to the same object in the same scope.

**Bad Example**:
```move
let ctx = test_scenario::ctx(&mut scenario);
let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
let mut treasury = test_scenario::take_shared<Treasury>(&scenario); // Error!
```

**Fix**: Take shared objects before creating the context:
```move
let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
let ctx = test_scenario::ctx(&mut scenario);
let (mut publication, publisher_cap) = publication::create_for_testing(ctx);
```

### 2. Unused Value Without Drop

**Error**: `error[E06001]: unused value without 'drop'`

**Cause**: Objects without the `drop` ability must be explicitly handled (transferred or destroyed).

**Common Resources That Need Handling**:
- `Treasury` (shared objects must be returned)
- `Publication`, `PublisherCap`
- `SubscriptionNFT`, `Article`
- Any custom structs without `drop` ability

**Fix**: Always clean up resources:
```move
// Return shared objects
test_scenario::return_shared(treasury);

// Transfer owned objects
transfer::public_transfer(publication, creator);
transfer::public_transfer(publisher_cap, creator);
```

### 3. Invalid Mutable Borrow

**Error**: `error[E04024]: invalid usage of immutable variable`

**Cause**: Trying to mutably borrow a variable not declared as `mut`.

**Example**:
```move
// Bad
let clock = clock::create_for_testing(ctx);
clock::increment_for_testing(&mut clock, 1000); // Error!

// Good
let mut clock = clock::create_for_testing(ctx);
clock::increment_for_testing(&mut clock, 1000); // OK
```

### 4. Type Incompatibility

**Error**: `error[E04007]: incompatible types`

**Common Causes**:
- Missing parameters after function signature changes
- Wrong parameter order
- Passing wrong types (e.g., `TxContext` instead of `Clock`)

## Resource Management

### Shared Objects Pattern

When working with shared objects like `Treasury`:

```move
#[test]
fun test_with_treasury() {
    let mut scenario = test_scenario::begin(creator);

    // 1. Initialize shared objects
    test_scenario::next_tx(&mut scenario, creator);
    {
        treasury::init_for_testing(test_scenario::ctx(&mut scenario));
    };

    // 2. Use shared objects
    test_scenario::next_tx(&mut scenario, creator);
    {
        // IMPORTANT: Take shared objects BEFORE creating context
        let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);

        // ... use treasury ...

        // 3. ALWAYS return shared objects
        test_scenario::return_shared(treasury);
    };

    test_scenario::end(scenario);
}
```

### Handling Multiple Publications

When tests create multiple publications or caps:

```move
// Even unused objects must be handled
let (publication1, publisher_cap1) = publication::create_for_testing(ctx);
let (publication2, publisher_cap2) = publication::create_for_testing(ctx);

// At cleanup, transfer ALL objects
transfer::public_transfer(publication1, creator);
transfer::public_transfer(publication2, creator);
transfer::public_transfer(publisher_cap1, creator);
transfer::public_transfer(publisher_cap2, creator);
```

## Test Scenario Patterns

### Standard Test Structure

```move
#[test]
fun test_example() {
    let creator = @0xCAFE;
    let mut scenario = test_scenario::begin(creator);

    // Create any clocks or other test utilities
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

    // Initialize shared objects if needed
    test_scenario::next_tx(&mut scenario, creator);
    {
        treasury::init_for_testing(test_scenario::ctx(&mut scenario));
    };

    // Main test logic
    test_scenario::next_tx(&mut scenario, creator);
    {
        let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);

        // ... test logic ...

        // Clean up - return shared objects first
        test_scenario::return_shared(treasury);
        // Then transfer owned objects
        transfer::public_transfer(owned_object, creator);
    };

    // Clean up test utilities
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}
```

### Expected Failure Tests

```move
#[test]
#[expected_failure(abort_code = module::ERROR_CODE)]
fun test_should_fail() {
    // Test setup...

    // This should abort with ERROR_CODE
    module::function_that_should_fail();

    // Still need cleanup for any created objects!
    // Even though the test is expected to fail
}
```

## Function Parameter Changes

When module functions change signatures (e.g., adding treasury parameter), update all test calls:

### Before:
```move
subscription::subscribe(
    &mut publication,
    tier,
    payment,
    &clock,
    ctx
)
```

### After:
```move
subscription::subscribe(
    &mut publication,
    &mut treasury,  // Added parameter
    tier,
    payment,
    &clock,
    ctx
)
```

**Tips for Systematic Updates**:
1. Use grep to find all occurrences: `grep -r "function_name(" tests/`
2. Check the function signature in the source module
3. Update parameter order consistently
4. Don't forget to initialize/take any new shared objects

## Best Practices

### 1. Import Management

Only import what you use:
```move
// Bad - unused imports
use sui::coin::{Self, Coin};  // If Coin alias isn't used

// Good
use sui::coin::{Self};
```

### 2. Clock Mutability

Only declare clock as `mut` if you're modifying it:
```move
// If using increment_for_testing
let mut clock = clock::create_for_testing(ctx);

// If only reading timestamp
let clock = clock::create_for_testing(ctx);
```

### 3. Resource Cleanup Order

Always clean up in this order:
1. Return shared objects (`test_scenario::return_shared`)
2. Transfer owned objects (`transfer::public_transfer`)
3. Destroy test utilities (`clock::destroy_for_testing`)
4. End scenario (`test_scenario::end`)

### 4. Test Organization

Group related tests in the same module and use clear naming:
```move
module project::subscription_tests {
    #[test]
    fun test_subscribe_basic_tier() { }

    #[test]
    fun test_subscribe_premium_tier() { }

    #[test]
    fun test_renew_subscription() { }
}
```

### 5. Use Test Helpers

Create helper functions for common setup:
```move
fun setup_publication_with_treasury(
    scenario: &mut Scenario
): (Publication, PublisherCap, Treasury) {
    // Common setup code
}
```

### 6. Coin Creation for Tests

Always use `coin::mint_for_testing` for creating test coins:
```move
let payment = coin::mint_for_testing<SUI>(amount, ctx);
```

### 7. Testing Shared Objects

Remember that shared objects persist across transactions in a scenario:
```move
// Transaction 1: Create and share
transfer::public_share_object(treasury);

// Transaction 2: Take and use
let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
// ... use ...
test_scenario::return_shared(treasury);
```

## Common Patterns for Specific Test Types

### Testing Access Control
```move
#[test]
fun test_unauthorized_access() {
    // Setup as authorized user
    test_scenario::next_tx(&mut scenario, authorized_user);
    // Create protected resource

    // Try to access as unauthorized user
    test_scenario::next_tx(&mut scenario, unauthorized_user);
    // This should fail
}
```

### Testing Time-based Features
```move
#[test]
fun test_expiration() {
    let mut clock = clock::create_for_testing(ctx);

    // Create time-sensitive object
    let subscription = create_subscription(&clock);

    // Advance time
    clock::increment_for_testing(&mut clock, 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check expiration
    assert!(!is_valid(&subscription, &clock));
}
```

### Testing Treasury Fee Collection
```move
#[test]
fun test_fee_collection() {
    let initial_balance = treasury::balance(&treasury);

    // Perform operation that collects fees
    subscription::subscribe(&mut publication, &mut treasury, ...);

    // Verify fee was collected
    let new_balance = treasury::balance(&treasury);
    assert!(new_balance > initial_balance);
}
```

## Debugging Tips

1. **Read error messages carefully** - Move compiler errors are usually very specific
2. **Check line numbers** - The error location often hints at the issue
3. **Verify parameter order** - Especially after refactoring
4. **Use `sui move test --filter test_name`** to run specific tests
5. **Add temporary assertions** to verify intermediate states

## Common Mistakes to Avoid

1. ❌ Forgetting to return shared objects
2. ❌ Not handling all created objects (even unused ones)
3. ❌ Wrong order of taking shared objects vs creating context
4. ❌ Missing `mut` on objects that will be modified
5. ❌ Not initializing required shared objects (like Treasury)
6. ❌ Incorrect parameter count after function signature changes
7. ❌ Using wrong address constants (`@0xCAFE` vs actual addresses)

## Example: Complete Test with Treasury

Here's a complete example showing proper treasury handling:

```move
#[test]
fun test_complete_flow_with_treasury() {
    let creator = @0xCAFE;
    let user = @0xBEEF;
    let mut scenario = test_scenario::begin(creator);

    // Initialize treasury
    test_scenario::next_tx(&mut scenario, creator);
    {
        treasury::init_for_testing(test_scenario::ctx(&mut scenario));
    };

    // Creator sets up publication
    test_scenario::next_tx(&mut scenario, creator);
    {
        let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);

        let (publication, publisher_cap) = publication::create_publication(
            b"Test Pub".to_string(),
            b"Description".to_string(),
            5_000_000_000,  // 5 SUI basic
            10_000_000_000, // 10 SUI premium
            false,          // no free tier
            ctx
        );

        test_scenario::return_shared(treasury);
        transfer::public_share_object(publication);
        transfer::public_transfer(publisher_cap, creator);
    };

    // User subscribes
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut treasury = test_scenario::take_shared<Treasury>(&scenario);
        let mut publication = test_scenario::take_shared<Publication>(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        let clock = clock::create_for_testing(ctx);

        let payment = coin::mint_for_testing<SUI>(5_000_000_000, ctx);

        let subscription = subscription::subscribe(
            &mut publication,
            &mut treasury,
            subscription::create_tier_basic(),
            payment,
            &clock,
            ctx
        );

        // Verify subscription is valid
        assert!(subscription::is_valid(&subscription, &clock));

        // Clean up
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(publication);
        transfer::public_transfer(subscription, user);
        clock::destroy_for_testing(clock);
    };

    test_scenario::end(scenario);
}
```

## Conclusion

Writing correct Move tests requires careful attention to:
- Resource lifecycle management
- Proper ordering of operations
- Handling all objects without `drop` ability
- Maintaining referential transparency

Following these patterns and practices will help avoid common compilation errors and create maintainable, correct test suites.