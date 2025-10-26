# WAL Token Transfer Scripts

Scripts to help manage and transfer WAL tokens between wallets.

## Scripts

### 1. `send-wal.sh` - Interactive Transfer

Finds all WAL tokens in your local wallet and transfers them to a recipient address with confirmation.

**Usage:**

```bash
# Use default recipient (web wallet)
./scripts/send-wal.sh

# Specify custom recipient
./scripts/send-wal.sh 0xYOUR_RECIPIENT_ADDRESS
```

**Features:**
- Interactive confirmation before transfer
- Shows detailed information about each WAL token
- Color-coded output for easy reading
- Transfer summary with success/failure counts

### 2. `send-wal-auto.sh` - Automated Transfer

Same as `send-wal.sh` but runs automatically without user confirmation (for scripts/automation).

**Usage:**

```bash
# Use default recipient (web wallet)
./scripts/send-wal-auto.sh

# Specify custom recipient
./scripts/send-wal-auto.sh 0xYOUR_RECIPIENT_ADDRESS
```

**Features:**
- No user confirmation required
- Suppressed transaction output for cleaner logs
- Perfect for CI/CD or automated workflows

## Prerequisites

1. **Sui CLI** installed and configured
   ```bash
   sui --version
   ```

2. **jq** (JSON processor) installed
   ```bash
   # macOS
   brew install jq

   # Ubuntu/Debian
   sudo apt-get install jq
   ```

3. **WAL tokens** in your local wallet
   ```bash
   # Get WAL from testnet faucet
   walrus get-wal
   ```

## Default Recipient Address

Both scripts use this default web wallet address:
```
0x652a9c2199ec35e9358f663595ba9ef38b6a297111e6f8045eb496c1a117dfa1
```

You can override it by passing a different address as the first argument.

## How It Works

1. **Find WAL Tokens**: Queries your local wallet for all objects containing `::wal::WAL`
2. **Display Details**: Shows object ID, balance, and token type for each WAL token
3. **Transfer**: Loops through each WAL token and transfers it to the recipient
4. **Summary**: Reports success/failure statistics

## Example Output

```
=== WAL Token Transfer Script ===

Recipient: 0x652a9c2199ec35e9358f663595ba9ef38b6a297111e6f8045eb496c1a117dfa1

Finding WAL tokens in your wallet...
Found 4 WAL token(s)

WAL Token Details:
  Object ID: 0x2389426b24590f433f2bdb6e76d713d8e346d94152512f1b96dd6811fa8c5a65
  Balance: 500000000 (raw units)
  Type: 0x2::coin::Coin<0x8270...::wal::WAL>

[1/4] Transferring 0x2389426b24590f433f2bdb6e76d713d8e346d94152512f1b96dd6811fa8c5a65...
✓ Transfer successful!

=== Transfer Summary ===
Total WAL tokens: 4
Successful: 4

All transfers completed successfully! 🎉
```

## Troubleshooting

### "sui client not found"
Install the Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### "command not found: jq"
Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### "No WAL tokens found"
Get WAL from the testnet faucet:
```bash
walrus get-wal
```

### Transfers failing
- Check you have enough SUI for gas (at least 0.01 SUI per transfer)
- Verify your wallet is connected: `sui client active-address`
- Ensure the WAL token objects haven't been already transferred

## Related Documentation

- [Walrus Setup Guide](../docs/WALRUS_SETUP.md) - Complete guide to getting and managing WAL tokens
- [Sui CLI Documentation](https://docs.sui.io/guides/developer/getting-started/sui-install)

## Notes

- Each WAL coin object typically contains 0.5 WAL (500000000 raw units)
- The testnet faucet usually provides 1 WAL split into 2 coin objects
- Gas cost per transfer is approximately 0.001 SUI
- Different WAL token types (different package IDs) are both valid on testnet
