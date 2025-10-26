# Deployment Guide

Complete guide for building, testing, and deploying the private publishing smart contracts.

## Prerequisites

### Required Tools

```bash
# Sui CLI (latest version recommended)
sui --version
# Expected: sui 1.x.x or higher

# Node.js (for E2E tests)
node --version
# Expected: v18+ or v20+

# npm or pnpm
npm --version
```

### Install Sui CLI

```bash
# Using cargo
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui

# Or using homebrew (macOS)
brew install sui

# Verify installation
sui --version
```

### Set Up Sui Client

```bash
# Create new configuration
sui client

# Create new address (if needed)
sui client new-address ed25519

# Request testnet tokens (if deploying to testnet)
sui client faucet

# Check your address and balance
sui client active-address
sui client gas
```

---

## Local Development

### 1. Build Contracts

```bash
cd move/

# Build the project
sui move build

# Expected output:
# INCLUDING DEPENDENCY Sui
# INCLUDING DEPENDENCY MoveStdlib
# BUILDING private_publishing
# Build successful
```

**Common Build Issues:**

```bash
# Error: dependencies not found
# Solution: Ensure Move.toml points to correct Sui framework
[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

# Error: bytecode version mismatch
# Solution: Update Sui CLI to match framework version
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

### 2. Run Unit Tests

```bash
# Run all Move tests
sui move test

# Run specific test module
sui move test publication_tests

# Run with verbose output
sui move test --verbose

# Run with coverage report
sui move test --coverage
```

**Expected Output:**
```
Running Move unit tests
[ PASS    ] private_publishing::publication_tests::test_create_publication
[ PASS    ] private_publishing::subscription_tests::test_subscribe
[ PASS    ] private_publishing::article_tests::test_publish_article
...
Test result: OK. Total tests: 20; passed: 20; failed: 0
```

### 3. Start Local Network

```bash
# In a separate terminal, start local Sui network
sui start

# Or with specific configuration
sui start --with-faucet --force-regenesis

# Expected output:
# Sui network started at http://127.0.0.1:9000
# Faucet available at http://127.0.0.1:9123
```

### 4. Deploy to Localnet

```bash
# Set active environment to localnet
sui client switch --env localnet

# Deploy contracts
sui client publish --gas-budget 500000000

# Expected output:
# Transaction Digest: 5xK2...
# Published Objects:
#   - PackageID: 0xabc123...
#   - Publisher: 0xdef456...
```

**Save Important Values:**

```bash
# After deployment, save these values:
export PACKAGE_ID=0xabc123...
export PUBLISHER_ID=0xdef456...

# Or add to .env file
echo "VITE_PACKAGE_ID=$PACKAGE_ID" >> ../private-publishing-dapp/.env
```

---

## Testnet Deployment

### 1. Configure Testnet Environment

```bash
# Add testnet endpoint (if not already configured)
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet

# Request testnet tokens
sui client faucet
# Wait a few seconds for tokens to arrive

# Verify balance
sui client gas
```

### 2. Deploy to Testnet

```bash
cd move/

# Build for testnet
sui move build

# Deploy with higher gas budget for testnet
sui client publish --gas-budget 500000000

# Save the Package ID
export TESTNET_PACKAGE_ID=<published_package_id>
```

### 3. Verify Deployment

```bash
# View package info
sui client object $TESTNET_PACKAGE_ID

# Query the package modules
sui client call --package $TESTNET_PACKAGE_ID --module publication --function name --args <publication_id>
```

### 4. Create Initial Objects

```bash
# Create a test publication
sui client call \
  --package $TESTNET_PACKAGE_ID \
  --module publication \
  --function create_publication \
  --args \
    "Test Publication" \
    "Test Description" \
    5000000000 \
    15000000000 \
    true \
  --gas-budget 10000000

# Save publication and publisher cap IDs
export PUBLICATION_ID=<created_publication_id>
export PUBLISHER_CAP_ID=<created_publisher_cap_id>
```

---

## Mainnet Deployment

### Important Considerations

- Test thoroughly on testnet first
- Audit contracts if handling significant value
- Have emergency pause mechanism
- Monitor for unusual activity
- Have upgrade strategy ready

### 1. Final Preparation

```bash
# Run complete test suite
cd move/
sui move test

# Run E2E tests
cd e2e-tests/
npm test

# Security checks
# - Review error handling
# - Verify access controls
# - Check for reentrancy issues
# - Validate input sanitization
```

### 2. Deploy to Mainnet

```bash
# Configure mainnet endpoint
sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443

# Switch to mainnet
sui client switch --env mainnet

# IMPORTANT: Ensure you have enough SUI for gas
sui client gas

# Deploy (use generous gas budget)
sui client publish --gas-budget 500000000

# SAVE ALL IDS IMMEDIATELY
echo "MAINNET_PACKAGE_ID=<package_id>" >> .env.mainnet
echo "MAINNET_PUBLISHER_ID=<publisher_id>" >> .env.mainnet
```

### 3. Initialize Platform

```bash
# Create Transfer Policy for SubscriptionNFT
sui client call \
  --package $MAINNET_PACKAGE_ID \
  --module marketplace_policies \
  --function create_transfer_policy \
  --args $MAINNET_PUBLISHER_ID \
  --gas-budget 10000000

# Add royalty rule (10% default)
sui client call \
  --package $MAINNET_PACKAGE_ID \
  --module marketplace_policies \
  --function add_royalty_rule \
  --args \
    <policy_id> \
    <policy_cap_id> \
    1000 \
    100000000 \
  --gas-budget 10000000
```

---

## Upgrade Strategy

Move packages are immutable by default. To enable upgrades:

### 1. Using UpgradeCap

```move
// In init function
fun init(otw: PUBLICATION, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    // Create upgrade capability
    let upgrade_cap = package::create_upgrade_cap(&publisher, ctx);

    // Transfer to admin
    transfer::public_transfer(upgrade_cap, ctx.sender());
    transfer::public_transfer(publisher, ctx.sender());
}
```

### 2. Publishing Upgrade

```bash
# Build new version
sui move build

# Publish upgrade
sui client upgrade \
  --upgrade-capability <upgrade_cap_id> \
  --gas-budget 500000000

# New package ID will be generated
# Update frontend configuration
```

### 3. Migration Considerations

- Old objects remain compatible if struct unchanged
- Add new fields with `Option<T>` for backwards compatibility
- Provide migration functions if needed
- Communicate changes to users

---

## Configuration Management

### Move.toml

```toml
[package]
name = "private_publishing"
edition = "2024.beta"
version = "0.1.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
private_publishing = "0x0"  # Will be replaced during publishing
```

### Environment Files

Create `.env` files for each environment:

**`.env.local`**
```bash
VITE_NETWORK=localnet
VITE_PACKAGE_ID=0x...
VITE_PUBLISHER_ID=0x...
```

**`.env.testnet`**
```bash
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0x...
VITE_PUBLISHER_ID=0x...
```

**`.env.mainnet`**
```bash
VITE_NETWORK=mainnet
VITE_PACKAGE_ID=0x...
VITE_PUBLISHER_ID=0x...
```

---

## Gas Optimization

### Estimating Gas Costs

```bash
# Estimate deployment cost
sui client publish --gas-budget 500000000 --dry-run

# Estimate transaction cost
sui client call --dry-run \
  --package $PACKAGE_ID \
  --module publication \
  --function create_publication \
  --args "Test" "Desc" 5000000000 15000000000 true
```

### Optimization Tips

**1. Minimize Storage:**
```move
// Bad: Large strings on-chain
public struct Article {
    content: String,  // Expensive!
}

// Good: Reference to off-chain storage
public struct Article {
    walrus_blob_id: String,  // Small reference
}
```

**2. Batch Operations:**
```typescript
// Good: Single transaction for multiple operations
const txb = new TransactionBuilder();
txb.moveCall({ target: "..." });  // Create publication
txb.moveCall({ target: "..." });  // Create stats
txb.moveCall({ target: "..." });  // Create policy
```

**3. Use Shared Objects Wisely:**
- Shared objects cost more to access
- Use owned objects when possible
- Consider freezing objects that don't change

---

## Monitoring & Logging

### Query Deployed Objects

```bash
# List objects owned by address
sui client objects

# Get specific object details
sui client object <object_id>

# Query dynamic fields
sui client dynamic-field <parent_object_id>
```

### Event Monitoring

```typescript
// Subscribe to events
const provider = new SuiClient({ url: getFullnodeUrl('testnet') });

provider.subscribeEvent({
  filter: {
    MoveEventModule: {
      package: PACKAGE_ID,
      module: 'publication',
    },
  },
  onMessage: (event) => {
    console.log('Event:', event);
  },
});
```

### Error Tracking

```typescript
// Log transaction failures
try {
  await signAndExecuteTransaction({ transaction: txb });
} catch (error) {
  console.error('Transaction failed:', {
    digest: error.digest,
    effects: error.effects,
    errors: error.errors,
  });
}
```

---

## Troubleshooting

### Common Deployment Errors

**"Insufficient gas"**
```bash
# Solution: Increase gas budget
sui client publish --gas-budget 1000000000
```

**"Package not found"**
```bash
# Solution: Ensure dependencies are correct
[dependencies]
Sui = { git = "...", rev = "framework/testnet" }
```

**"Address resolution failed"**
```bash
# Solution: Check Move.toml addresses section
[addresses]
private_publishing = "0x0"
```

**"Object not found"**
```bash
# Solution: Object may not be owned or doesn't exist
sui client object <object_id>
```

### Network Issues

```bash
# Check network status
curl https://fullnode.testnet.sui.io:443 -v

# Switch to different RPC endpoint
sui client new-env --alias testnet2 --rpc <alternative_rpc_url>
sui client switch --env testnet2
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and audited
- [ ] Gas costs estimated
- [ ] Emergency procedures documented
- [ ] Backup admin keys secured
- [ ] Monitoring tools configured

### During Deployment

- [ ] Record all object IDs
- [ ] Save deployment transaction digest
- [ ] Verify object creation
- [ ] Test basic operations
- [ ] Initialize platform objects
- [ ] Update frontend configuration

### Post-Deployment

- [ ] Verify all modules accessible
- [ ] Test complete user flows
- [ ] Monitor events and errors
- [ ] Update documentation
- [ ] Announce to users
- [ ] Begin monitoring dashboard

---

## Next Steps

After successful deployment:

1. **Frontend Integration** - Update package IDs in dApp configuration
2. **Testing** - Run E2E tests against deployed contracts
3. **Monitoring** - Set up alerting for errors and unusual activity
4. **Documentation** - Update user-facing docs with contract addresses

See also:
- [Integration Guide](./INTEGRATION_GUIDE.md) - Connect frontend to contracts
- [Testing Guide](./TESTING.md) - Comprehensive testing strategies
- [Security Guide](./SECURITY.md) - Security best practices
