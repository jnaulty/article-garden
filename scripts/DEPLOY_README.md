# Deploy and Update Script

## Overview

The `deploy-and-update.sh` script automates the complete workflow for deploying your Move package to Sui testnet and updating your dApp configuration.

## What It Does

1. **Builds** the Move package (`sui move build`)
2. **Tests** the Move package (`sui move test`)
3. **Publishes** to testnet (`sui client publish`)
4. **Extracts** the Package ID and Treasury ID from the publish output
5. **Updates** the dApp's `networkConfig.ts` with the new IDs

## Prerequisites

- Sui CLI installed and configured
- Active Sui address with testnet SUI tokens
- Connected to testnet (`sui client switch --env testnet`)

## Usage

### Basic Usage

```bash
./scripts/deploy-and-update.sh
```

### From Project Root

```bash
cd /path/to/article-garden
./scripts/deploy-and-update.sh
```

### From Anywhere

```bash
<path-to>/article-garden/scripts/deploy-and-update.sh
```

## What Gets Updated

The script updates `private-publishing-dapp/src/networkConfig.ts`:

```typescript
testnet: {
  url: getFullnodeUrl("testnet"),
  variables: {
    packageId: "0x..." // ← Updated automatically
    treasuryId: "0x..." // ← Updated automatically
    sealKeyServers: [...] // ← Not modified
  }
}
```

## Output

The script provides color-coded output:
- 🔵 Info messages (blue)
- ✓ Success messages (green)
- ⚠ Warning messages (yellow)
- ✗ Error messages (red)

## Deployment Info

After deployment, details are saved to `move/.deploy_output.json`:

```json
{
  "packageId": "0x...",
  "treasuryId": "0x...",
  "network": "testnet",
  "timestamp": "2025-10-27T...",
  "fullOutput": "..."
}
```

## Backup

The script automatically creates a backup of your network config:
- Location: `private-publishing-dapp/src/networkConfig.ts.bak`
- To revert: `cp networkConfig.ts.bak networkConfig.ts`

## Error Handling

The script will stop and show an error if:
- Move build fails
- Move tests fail
- Publishing fails
- Package/Treasury IDs cannot be extracted
- Network config file is not found

## Gas Budget

The script uses a gas budget of 500,000,000 MIST (0.5 SUI) for publishing. Ensure your active address has sufficient funds.

## Next Steps After Running

1. Test your dApp with the new package
2. Verify all functionality works
3. Commit the updated `networkConfig.ts` if everything is good
4. Delete the backup file once confirmed

## Troubleshooting

### "Publish failed"
- Check you have enough SUI in your testnet account
- Ensure you're connected to testnet: `sui client envs`
- Get testnet tokens: https://discord.com/channels/916379725201563759/1037811694564560966

### "Could not extract Package ID"
- Check the full output in `.deploy_output.json`
- The publish may have succeeded but output format changed
- Manually extract the IDs and update `networkConfig.ts`

### Script won't run
- Make sure it's executable: `chmod +x scripts/deploy-and-update.sh`
- Check you're in the right directory
- Try running with bash: `bash scripts/deploy-and-update.sh`

## Manual Alternative

If you prefer to do this manually:

```bash
# 1. Build and test
cd move
sui move build
sui move test

# 2. Publish
sui client publish --gas-budget 500000000

# 3. Copy the Package ID and Treasury ID from output

# 4. Update private-publishing-dapp/src/networkConfig.ts manually
```

## See Also

- `WAL_SCRIPTS_README.md` - Scripts for managing Walrus storage
- `test-setup.sh` - Setup script for testing environment
