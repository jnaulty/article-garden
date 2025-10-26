# Private Publishing E2E Tests

End-to-end testing suite for the Private Publishing Platform using the Sui TypeScript SDK.

## Setup

### Prerequisites
- Node.js >=18.0.0
- Sui CLI installed
- Local Sui network access

### Installation

```bash
cd move/e2e-tests
npm install
```

## Running Tests

### 1. Start Local Sui Network

First, start a local Sui network with faucet enabled:

```bash
sui start --with-faucet --force-regenesis
```

This will start:
- Sui node on `http://127.0.0.1:9000`
- Faucet service on `http://127.0.0.1:9123`

### 2. Run Tests

In a separate terminal:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Build contracts and run tests
npm run test:build

# Type check only
npm run typecheck
```

## Project Structure

```
e2e-tests/
├── utils/               # Test utilities
│   ├── constants.ts     # Shared constants (prices, durations, etc.)
│   ├── wallets.ts       # Wallet creation and funding
│   ├── setup.ts         # Test environment setup
│   ├── deploy.ts        # Contract deployment
│   └── time.ts          # Time utilities for expiry testing
├── tests/               # Test suites
│   ├── publication.test.ts
│   ├── subscription.test.ts
│   ├── article.test.ts
│   ├── access_control.test.ts
│   ├── analytics.test.ts
│   └── marketplace.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Test Coverage

### ✅ Implemented Tests

#### Publication Module (`publication.test.ts`)
- ✅ Creating publications successfully
- ✅ Rejecting invalid pricing (premium < basic)
- 🔧 Updating pricing with valid PublisherCap (needs local network indexing fix)
- 🔧 Toggling free tier (needs local network indexing fix)
- 🔧 Rejecting updates with wrong PublisherCap (needs local network indexing fix)

### 📋 Pending Test Modules
- Subscription Module
- Article Module
- Access Control Module
- Analytics Module
- Marketplace Module
- Integration Tests

## Known Issues

### Local Network Indexing Delays

Some tests that perform multiple sequential transactions may fail with "object not found" errors. This is due to local network indexing delays where objects created in one transaction aren't immediately available for the next transaction.

**Workaround**: Tests use `waitForObject()` helper with retry logic, but local networks may need longer delays.

**Tests Affected**:
- Multi-step tests that reference objects from previous transactions

### Gas Coin Version Conflicts

When tests run concurrently using the same wallet, gas coin version conflicts can occur.

**Solution**: Each test creates a fresh funded wallet via `createFundedKeypair(client)`

## Writing New Tests

### Basic Test Pattern

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { setupTestEnvironment } from '../utils/setup.js';
import { createFundedKeypair } from '../utils/wallets.js';
import { deployPackage, getFunctionName } from '../utils/deploy.js';

describe('Module Name', () => {
  let client: SuiClient;
  let packageId: string;

  beforeAll(async () => {
    client = await setupTestEnvironment();
    const deployer = await createFundedKeypair(client);
    const deployed = await deployPackage(client, deployer);
    packageId = deployed.packageId;
  }, 120000);

  it('should do something', async () => {
    // Create fresh wallet for this test
    const testWallet = await createFundedKeypair(client);

    const tx = new Transaction();
    const [result] = tx.moveCall({
      target: getFunctionName(packageId, 'module', 'function'),
      arguments: [/* ... */],
    });

    // Transfer objects if needed
    tx.transferObjects([result], testWallet.toSuiAddress());

    const txResult = await client.signAndExecuteTransaction({
      signer: testWallet,
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    expect(txResult.effects?.status.status).toBe('success');
  });
});
```

### Best Practices

1. **Use Fresh Wallets**: Create a new funded wallet for each test to avoid gas coin conflicts
   ```typescript
   const testWallet = await createFundedKeypair(client);
   ```

2. **Transfer Objects**: Always transfer returned objects to an address
   ```typescript
   const [obj1, obj2] = tx.moveCall({...});
   tx.transferObjects([obj1, obj2], wallet.toSuiAddress());
   ```

3. **Wait for Objects**: When using objects in subsequent transactions, wait for them to be indexed
   ```typescript
   await waitForObject(client, objectId);
   ```

4. **Check Transaction Status**: Always verify transaction success
   ```typescript
   expect(result.effects?.status.status).toBe('success');
   ```

5. **Use Type-Safe Arguments**: Use the type-safe argument builders
   ```typescript
   tx.pure.string('value')
   tx.pure.u64(1000000000n)
   tx.pure.bool(true)
   ```

## Debugging

### Enable Verbose Logging

Check transaction details:
```typescript
console.log('Transaction result:', JSON.stringify(result, null, 2));
```

### View Network Logs

The `sui start` terminal shows network activity and can help debug issues.

### Check Object State

```typescript
const obj = await client.getObject({
  id: objectId,
  options: { showContent: true, showOwner: true },
});
console.log('Object:', obj);
```

## Configuration

### Network Settings (`utils/constants.ts`)
- `LOCALNET_URL`: `http://127.0.0.1:9000`
- `FAUCET_URL`: `http://127.0.0.1:9123/gas`

### Test Timeouts (`vitest.config.ts`)
- Test timeout: 60 seconds
- Hook timeout: 30 seconds (for setup/teardown)

### Gas Budget
- Default: 0.1 SUI (`100_000_000 MIST`)

## Continuous Integration

Currently configured for local testing only. To add CI:

1. Use a persistent testnet or devnet
2. Update network URLs in constants
3. Add GitHub Actions workflow
4. Configure secrets for deployment keys

## Troubleshooting

### "Failed to connect to local Sui network"
- Ensure `sui start --with-faucet` is running
- Check that port 9000 and 9123 are available

### "Package not found on-chain"
- Wait for package indexing (3-5 seconds after deployment)
- Check `deployPackage` output for package ID

### "Object not found" errors
- Increase wait time in `waitForObject`
- Add delays between sequential transactions
- Use fresh objects for each test

### Tests timeout
- Increase test timeout in `vitest.config.ts`
- Check for infinite loops or stuck network calls
- Verify faucet is responding

## Contributing

When adding new tests:
1. Follow the existing patterns
2. Add comprehensive assertions
3. Document any known issues
4. Run full test suite before committing

## Resources

- [Sui TypeScript SDK Docs](https://sdk.mystenlabs.com/typescript)
- [Vitest Documentation](https://vitest.dev/)
- [Move Language Book](https://move-language.github.io/move/)
