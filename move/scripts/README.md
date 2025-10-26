# Private Publishing Platform - Test Scripts

Comprehensive CLI-based test scripts for testing the Private Publishing Platform on a local Sui network.

## Overview

These scripts provide end-to-end testing of all modules using the Sui CLI:
- **Publication**: Create and manage publications
- **Subscription**: Free/Basic/Premium tier subscriptions
- **Article**: Publish, update, and archive content
- **Analytics**: Track subscribers, revenue, and views
- **Access Control**: Read tokens and subscription verification

## Prerequisites

1. **Sui CLI installed**
   ```bash
   sui --version
   ```
   If not installed, see: https://docs.sui.io/guides/developer/getting-started/sui-install

2. **`jq` installed** (for JSON parsing)
   ```bash
   # macOS
   brew install jq

   # Ubuntu/Debian
   sudo apt-get install jq
   ```

3. **`bc` installed** (for calculations)
   Usually pre-installed on Unix systems

## Quick Start

### Option 1: Run All Tests (Recommended)

```bash
# Terminal 1: Start local network
cd /path/to/private_publishing/move
./scripts/00_setup_local_network.sh

# Terminal 2: Run all tests
cd /path/to/private_publishing/move
chmod +x scripts/*.sh  # Make scripts executable
./scripts/run_all_tests.sh
```

### Option 2: Run Tests Individually

```bash
# Terminal 1: Start local network
./scripts/00_setup_local_network.sh

# Terminal 2: Run tests step by step
./scripts/01_deploy.sh
./scripts/02_test_publication.sh
./scripts/03_test_subscription.sh
./scripts/04_test_article.sh
./scripts/05_test_analytics.sh
./scripts/06_test_access_control.sh
```

## Script Descriptions

### 00_setup_local_network.sh
**Purpose**: Start a local Sui network for testing

**What it does**:
- Checks for Sui CLI installation
- Creates/switches to local environment
- Starts network with faucet enabled
- Uses force-regenesis for clean state

**Usage**:
```bash
./scripts/00_setup_local_network.sh
```

**Note**: Keep this terminal running. Use another terminal for tests.

---

### 01_deploy.sh
**Purpose**: Deploy the private_publishing package

**What it does**:
- Requests test SUI from faucet
- Builds the Move package
- Publishes to local network
- Saves Package ID and Publisher ID to `.env.local`

**Usage**:
```bash
./scripts/01_deploy.sh
```

**Output**: Package ID, Publisher ID saved to `.env.local`

---

### 02_test_publication.sh
**Purpose**: Test publication creation and management

**Tests**:
1. ✅ Create publication with pricing and free tier
2. ✅ View publication details
3. ✅ Update pricing (10 SUI basic, 20 SUI premium)
4. ✅ Toggle free tier on/off
5. ✅ Verify ownership via PublisherCap

**Usage**:
```bash
./scripts/02_test_publication.sh
```

**Output**: Publication ID, PublisherCap ID

---

### 03_test_subscription.sh
**Purpose**: Test subscription NFTs across all tiers

**Tests**:
1. ✅ Subscribe with Free tier (0 SUI)
2. ✅ Subscribe with Basic tier (5 SUI)
3. ✅ Subscribe with Premium tier (15 SUI)
4. ✅ Renew a subscription (extends expiry by 30 days)
5. ✅ View subscription details (tier, expiry, subscriber)

**Usage**:
```bash
./scripts/03_test_subscription.sh
```

**Output**: 3 Subscription NFT IDs (Free, Basic, Premium)

---

### 04_test_article.sh
**Purpose**: Test article publishing and management

**Tests**:
1. ✅ Publish Free tier article
2. ✅ Publish Basic tier article
3. ✅ Publish Premium tier article
4. ✅ Update article metadata (title, excerpt)
5. ✅ Archive/unarchive articles
6. ✅ Verify article count increments

**Usage**:
```bash
./scripts/04_test_article.sh
```

**Output**: 3 Article IDs with different tier requirements

---

### 05_test_analytics.sh
**Purpose**: Test analytics tracking and reporting

**Tests**:
1. ✅ Create PublicationStats
2. ✅ Record subscriptions by tier (1 Free, 3 Basic, 2 Premium)
3. ✅ Record revenue (15 SUI basic + 30 SUI premium = 45 SUI total)
4. ✅ Record article views (5/10/3 views for different articles)
5. ✅ View comprehensive analytics dashboard

**Usage**:
```bash
./scripts/05_test_analytics.sh
```

**Output**:
- PublicationStats ID
- Subscriber counts by tier
- Total revenue
- Article view counts

---

### 06_test_access_control.sh
**Purpose**: Test access verification and read tokens

**Tests**:
1. ✅ Generate read token for Basic article (~0.167 SUI daily rate)
2. ✅ Generate read token for Free article (0 SUI)
3. ✅ Verify token validity (24-hour expiry)
4. ✅ Verify subscription-based access (tier hierarchy)

**Usage**:
```bash
./scripts/06_test_access_control.sh
```

**Output**: Read Token IDs for pay-per-article access

---

### run_all_tests.sh
**Purpose**: Master script to run all tests in sequence

**What it does**:
- Checks local network connectivity
- Runs all 6 test scripts automatically
- Displays comprehensive results summary
- Reports total test duration

**Usage**:
```bash
./scripts/run_all_tests.sh
```

**Duration**: ~2-3 minutes for full test suite

## Test Results

All test results are saved to `.env.local` in the following format:

```bash
# Package deployment
PACKAGE_ID=0x...
PUBLISHER_ID=0x...
ACTIVE_ADDRESS=0x...

# Publication
PUBLICATION_ID=0x...
PUBLISHER_CAP_ID=0x...

# Subscriptions
FREE_SUBSCRIPTION_ID=0x...
BASIC_SUBSCRIPTION_ID=0x...
PREMIUM_SUBSCRIPTION_ID=0x...

# Articles
ARTICLE_FREE_ID=0x...
ARTICLE_BASIC_ID=0x...
ARTICLE_PREMIUM_ID=0x...

# Analytics
STATS_ID=0x...

# Access Control
READ_TOKEN_ID=0x...
```

You can source this file in other scripts:
```bash
source .env.local
echo $PACKAGE_ID
```

## Viewing Results

### Query Objects
```bash
# View any object
sui client object <OBJECT_ID>

# View with JSON output
sui client object <OBJECT_ID> --json | jq '.'
```

### Query Transactions
```bash
# List recent transactions
sui client call-history

# View specific transaction
sui client tx <DIGEST> --json | jq '.'
```

### Query Events
```bash
# View all events from your address
sui client events --sender <ADDRESS>

# View events for specific module
sui client events --module publication
```

## Troubleshooting

### Issue: "Error: Sui client not configured"
**Solution**: The local network isn't running
```bash
# Terminal 1
./scripts/00_setup_local_network.sh
```

### Issue: "Error: .env.local not found"
**Solution**: Run deployment first
```bash
./scripts/01_deploy.sh
```

### Issue: "Error: Insufficient funds"
**Solution**: Request more test SUI
```bash
sui client faucet
sui client gas  # Check balance
```

### Issue: "jq: command not found"
**Solution**: Install jq
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Issue: Network not accessible
**Solution**: Verify local network is running
```bash
curl http://127.0.0.1:9000
# Should return network info
```

## Test Coverage

| Module | Functions Tested | Coverage |
|--------|------------------|----------|
| Publication | 4/4 | 100% |
| Subscription | 4/6 | 67% (no Kiosk tests) |
| Article | 4/4 | 100% |
| Analytics | 4/4 | 100% |
| Access Control | 2/4 | 50% (verification is off-chain) |
| Marketplace Policies | 0/6 | 0% (requires TransferPolicy setup) |

**Total**: 18/26 functions tested via CLI (69%)

## Extending Tests

### Adding Custom Test Scenarios

Create new script: `scripts/07_custom_test.sh`

```bash
#!/bin/bash
set -e

source .env.local  # Load existing objects

# Your custom test logic here
sui client call \
    --package $PACKAGE_ID \
    --module <module_name> \
    --function <function_name> \
    --args <args> \
    --gas-budget 100000000 \
    --json
```

### Testing Marketplace Policies

Marketplace policy tests require additional setup:

```bash
# Create TransferPolicy (requires Publisher from init)
sui client call \
    --package 0x2 \
    --module transfer_policy \
    --function new \
    --type-args "$PACKAGE_ID::subscription::SubscriptionNFT" \
    --args $PUBLISHER_ID \
    --gas-budget 100000000
```

## Tips

1. **Use `--json` output** for programmatic parsing
2. **Check gas balance** before running expensive operations
3. **Save important IDs** to variables for reuse
4. **Use `jq` filters** to extract specific fields
5. **Test failure cases** by modifying arguments

## Resources

- [Sui CLI Reference](https://docs.sui.io/references/cli)
- [Local Network Guide](https://docs.sui.io/guides/developer/sui-101/local-network)
- [Move on Sui](https://docs.sui.io/guides/developer/sui-101/move-overview)
- [Project Documentation](../README.md)

## License

MIT License - See project root for details
