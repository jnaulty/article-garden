# Security Guide

Security considerations and best practices for the private publishing platform.

## Table of Contents

- [Security Model](#security-model)
- [Access Control](#access-control)
- [Common Vulnerabilities](#common-vulnerabilities)
- [Audit Checklist](#audit-checklist)
- [Best Practices](#best-practices)
- [Incident Response](#incident-response)

---

## Security Model

### Capability-Based Security

The platform uses Move's object capability model for access control:

```move
// PublisherCap grants publication management rights
public struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
}

// Only functions with PublisherCap can modify publication
public fun update_pricing(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,  // Required!
    basic_price: u64,
    premium_price: u64,
)
```

**Security Properties:**
- Capabilities cannot be forged
- Ownership is explicit and verifiable
- No centralized access control lists
- Transferable but trackable

### Trust Assumptions

**Trusted:**
- Sui blockchain consensus
- Seal key servers (for decryption)
- Walrus storage network
- Clock object (0x6)

**Untrusted:**
- User input (always validated)
- External callers (capability checks)
- Off-chain data (verified on-chain)

---

## Access Control

### 1. Publication Operations

All privileged operations require PublisherCap:

```move
// GOOD: Capability check
assert!(
    publisher_cap.publication_id == object::id(publication),
    EInvalidPublicationId
);

// BAD: No verification
// Anyone could call this!
public fun update_pricing(publication: &mut Publication, price: u64)
```

### 2. Analytics Privacy

Stats are creator-only:

```move
// All analytics functions verify ownership
public fun get_stats(
    stats: &PublicationStats,
    publisher_cap: &PublisherCap,
): (SubscriberCounts, u64, VecMap<ID, u64>) {
    assert!(
        publisher_cap.publication_id == stats.publication_id,
        EInvalidPublicationId
    );
    // Return private data
}
```

**Why This Matters:**
- Subscriber counts are sensitive
- Revenue is confidential
- View metrics are proprietary
- Only creator should see analytics

### 3. Package-Level Functions

Some functions are only callable within the package:

```move
// Only other modules in this package can call
public(package) fun increment_article_count(publication: &mut Publication) {
    publication.article_count = publication.article_count + 1;
}
```

**Use Cases:**
- Internal state updates
- Cross-module coordination
- Preventing external manipulation

---

## Common Vulnerabilities

### 1. Missing Capability Checks

**Vulnerability:**
```move
// BAD: No capability verification
public fun publish_article(
    publication: &mut Publication,
    title: String,
    // Missing publisher_cap parameter!
)
```

**Fix:**
```move
// GOOD: Require capability
public fun publish_article(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,  // Required
    title: String,
) {
    assert!(
        publisher_cap.publication_id == object::id(publication),
        EInvalidPublicationId
    );
    // Safe to proceed
}
```

### 2. Price Validation

**Vulnerability:**
```move
// BAD: No validation
publication.basic_price = basic_price;
publication.premium_price = premium_price;
```

**Fix:**
```move
// GOOD: Validate prices
assert!(premium_price >= basic_price, EInvalidPrice);
publication.basic_price = basic_price;
publication.premium_price = premium_price;
```

**Why:** Prevents illogical pricing where premium < basic.

### 3. Payment Verification

**Vulnerability:**
```move
// BAD: Accept payment without checking amount
public fun subscribe(
    publication: &Publication,
    tier: Tier,
    payment: Coin<SUI>,  // Could be any amount!
)
```

**Fix:**
```move
// GOOD: Verify payment amount
let required = match (tier) {
    Tier::Basic => publication::basic_price(publication),
    Tier::Premium => publication::premium_price(publication),
    _ => 0,
};

let paid = coin::value(&payment);
assert!(paid >= required, EInsufficientPayment);
```

### 4. Expired Subscription Access

**Vulnerability:**
```move
// BAD: No expiry check
public fun verify_access(subscription: &SubscriptionNFT): bool {
    // Always returns true!
    true
}
```

**Fix:**
```move
// GOOD: Check expiry
public fun is_valid(subscription: &SubscriptionNFT, clock: &Clock): bool {
    let current_time = clock::timestamp_ms(clock) / 1000;
    subscription.expires_at > current_time
}
```

### 5. Tier Hierarchy Violations

**Vulnerability:**
```move
// BAD: Direct tier comparison
subscription.tier == article.tier
```

**Fix:**
```move
// GOOD: Hierarchical comparison
let subscription_level = tier_to_u8(&subscription.tier);
let required_level = tier_to_u8(&required_tier);
subscription_level >= required_level
```

**Why:** Premium (2) should access Basic (1) and Free (0) content.

### 6. Seal Key Verification

**Vulnerability:**
```move
// BAD: No key ID verification
entry fun seal_approve_subscription(
    id: vector<u8>,
    subscription: &SubscriptionNFT,
    article: &Article,
    clock: &Clock,
) {
    // Missing: verify id == article.seal_key_id
    let has_access = verify_subscription_access(...);
    assert!(has_access, EAccessDenied);
}
```

**Fix:**
```move
// GOOD: Verify seal key ID
let seal_key_id = article::seal_key_id(article);
assert!(id == seal_key_id, EAccessDenied);
```

### 7. Object Relationship Validation

**Vulnerability:**
```move
// BAD: No relationship check
public fun renew(
    subscription: &mut SubscriptionNFT,
    publication: &Publication,  // Could be any publication!
    payment: Coin<SUI>,
)
```

**Fix:**
```move
// GOOD: Verify subscription belongs to publication
assert!(
    subscription.publication_id == publication::id(publication),
    EInvalidPublicationId
);
```

---

## Audit Checklist

### Access Control

- [ ] All privileged functions require capability
- [ ] Capability publication_id matches target object
- [ ] No missing capability checks
- [ ] Package-level functions only for internal use

### Input Validation

- [ ] Payment amounts verified
- [ ] Prices validated (premium >= basic)
- [ ] Tier values validated
- [ ] String lengths bounded
- [ ] Addresses validated (non-zero where needed)

### Business Logic

- [ ] Subscription expiry checked
- [ ] Tier hierarchy respected
- [ ] Article count increments correctly
- [ ] Revenue calculations accurate
- [ ] Timestamp handling correct

### Encryption & Privacy

- [ ] Seal key IDs verified
- [ ] Walrus blob IDs stored correctly
- [ ] Analytics require capability
- [ ] No plaintext content on-chain
- [ ] Decryption policies enforced

### Economic Security

- [ ] No integer overflow in prices
- [ ] No underflow in calculations
- [ ] Royalty percentages bounded (≤ 100%)
- [ ] Minimum royalty respected
- [ ] Free tier properly gated

### Object Lifecycle

- [ ] Objects properly transferred
- [ ] Shared objects used correctly
- [ ] No orphaned objects
- [ ] Cleanup functions available
- [ ] Upgrade path considered

---

## Best Practices

### 1. Defensive Programming

```move
// Always validate
assert!(value > 0, EInvalidValue);
assert!(address != @0x0, EInvalidAddress);

// Check object relationships
assert!(child.parent_id == parent.id, EInvalidParent);

// Verify capabilities
assert!(cap.resource_id == resource.id, EUnauthorized);
```

### 2. Fail Fast

```move
// GOOD: Check early
public fun complex_operation(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,
    data: vector<u8>,
) {
    // Verify capability first
    assert!(
        publisher_cap.publication_id == object::id(publication),
        EInvalidPublicationId
    );

    // Then validate inputs
    assert!(vector::length(&data) <= MAX_SIZE, EDataTooLarge);

    // Finally do work
    // ...
}
```

### 3. Clear Error Messages

```move
// GOOD: Specific error codes
const EInvalidPrice: u64 = 1;
const EInsufficientPayment: u64 = 2;
const EInvalidPublicationId: u64 = 3;

// Use descriptive names
const ESubscriptionExpired: u64 = 4;
const ETierTooLow: u64 = 5;
```

### 4. Minimize Privilege

```move
// GOOD: Only creator can update pricing
public fun update_pricing(
    publication: &mut Publication,
    publisher_cap: &PublisherCap,
    ...
)

// GOOD: Only package can update article count
public(package) fun increment_article_count(...)

// GOOD: Anyone can read public fields
public fun name(publication: &Publication): String
```

### 5. Audit Trail via Events

```move
// Emit events for security-relevant actions
event::emit(PublicationCreated {
    publication_id,
    creator,
    name,
});

event::emit(PricingUpdated {
    publication_id,
    basic_price,
    premium_price,
});
```

---

## Testing for Security

### Capability Tests

```move
#[test]
#[expected_failure(abort_code = EInvalidPublicationId)]
fun test_wrong_publisher_cap() {
    // Create publication A
    let (pub_a, cap_a) = create_publication(...);

    // Create publication B
    let (pub_b, cap_b) = create_publication(...);

    // Try to use cap_b on pub_a (should fail)
    update_pricing(&mut pub_a, &cap_b, ...);
}
```

### Payment Tests

```move
#[test]
#[expected_failure(abort_code = EInsufficientPayment)]
fun test_insufficient_payment() {
    let publication = /* setup */;

    // Basic tier costs 5 SUI
    let payment = coin::mint_for_testing<SUI>(3_000_000_000, ctx);

    // Should fail - not enough
    subscribe(&mut publication, Tier::Basic, payment, ...);
}
```

### Access Control Tests

```move
#[test]
fun test_expired_subscription_denied() {
    // Create subscription
    let subscription = /* setup */;

    // Fast forward time past expiry
    clock::set_for_testing(&mut clock, expiry_time + 1);

    // Should return false
    assert!(!is_valid(&subscription, &clock));
}
```

---

## Incident Response

### If Vulnerability Discovered

1. **Assess Severity**
   - Can funds be stolen?
   - Can access be bypassed?
   - Can data be corrupted?

2. **Immediate Actions**
   - Document the vulnerability
   - Assess exploitability
   - Estimate affected users
   - Prepare fix

3. **Communication**
   - Notify affected users
   - Publish security advisory
   - Coordinate disclosure

4. **Mitigation**
   - Deploy patched version
   - Migrate affected objects
   - Compensate victims if needed

5. **Post-Mortem**
   - Root cause analysis
   - Update tests
   - Improve processes

### Emergency Contacts

- Sui Security: security@mystenlabs.com
- Bug Bounty: (if applicable)

---

## Security Resources

### Sui Security Best Practices

- [Sui Move Security Guidelines](https://docs.sui.io/guides/developer/advanced/move-security-best-practices)
- [Move Prover](https://github.com/move-language/move/tree/main/language/move-prover)
- [Common Patterns](https://docs.sui.io/guides/developer/sui-101/design-patterns)

### Audit Firms

- Runtime Verification
- Trail of Bits
- Quantstamp
- OpenZeppelin (for Move)

### Bug Bounty Programs

Consider establishing a bug bounty program for mainnet deployment:
- Define scope (smart contracts, frontend, APIs)
- Set reward tiers based on severity
- Establish disclosure guidelines
- Partner with Immunefi or HackerOne

---

## Threat Model

### Threat: Capability Theft

**Attack:** Steal or copy PublisherCap
**Mitigation:** Capabilities are unforgeable Move objects
**Residual Risk:** Social engineering to transfer

### Threat: Payment Manipulation

**Attack:** Pay less than required amount
**Mitigation:** Strict payment verification
**Residual Risk:** None if validation correct

### Threat: Subscription Forgery

**Attack:** Create fake subscription NFT
**Mitigation:** Only module can mint subscriptions
**Residual Risk:** None

### Threat: Seal Key Compromise

**Attack:** Decrypt without permission
**Mitigation:** Seal servers verify on-chain access
**Residual Risk:** Seal server compromise

### Threat: Walrus Data Loss

**Attack:** Lose encrypted article data
**Mitigation:** Walrus redundancy and encoding
**Residual Risk:** Network-wide failure

---

## Compliance Considerations

### Privacy Regulations (GDPR, CCPA)

**Concern:** Subscriber data on public blockchain
**Mitigation:**
- Use addresses, not real names
- Encrypt sensitive data off-chain
- Implement data minimization
- Provide data deletion mechanisms (burn NFTs)

### Securities Regulations

**Concern:** Subscriptions as financial instruments
**Mitigation:**
- Utility-focused design
- No investment returns
- Consumable access rights
- Legal review recommended

### Content Moderation

**Concern:** Illegal content published
**Mitigation:**
- Off-chain content review
- Publisher guidelines
- Reporting mechanisms
- Seal server policies

---

## See Also

- [Module API](./MODULE_API.md) - Function reference
- [Testing Guide](./TESTING.md) - Security testing
- [Data Structures](./DATA_STRUCTURES.md) - Object definitions
- [Events](./EVENTS.md) - Audit trail events
