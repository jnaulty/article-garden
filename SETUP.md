# Private Publishing Platform - Setup Guide

**Complete guide to get the Private Publishing Platform up and running locally**

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Docker & Docker Compose** (Recommended)
   - Docker Desktop 4.0+
   - Docker Compose 2.0+
   - [Install Docker](https://docs.docker.com/get-docker/)

2. **OR Manual Setup Requirements:**
   - **Node.js** 18+ and npm 9+
   - **Sui CLI** (`cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui`)
   - **Git**

### Optional

- **Sui Wallet** (browser extension) for testing
- **VS Code** with Sui extension

---

## Quick Start (Docker)

**Get everything running in under 5 minutes!**

### 1. Clone and Navigate

```bash
cd /path/to/article-garden
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **Sui Local Network** (RPC: http://localhost:9000, Faucet: http://localhost:9123)
- **Frontend dApp** (http://localhost:5173)

### 3. Check Service Health

```bash
docker-compose ps
```

All services should show "running" status.

### 4. Deploy Smart Contracts

```bash
# Enter the Move contracts directory
cd move

# Publish the package to localnet
sui client publish --gas-budget 500000000

# Copy the package ID from output
# Example: 0x1234...abcd
```

### 5. Configure Frontend

```bash
cd ../private-publishing-dapp

# Create .env file
cat > .env << EOF
VITE_PACKAGE_ID=<YOUR_PACKAGE_ID_FROM_STEP_4>
VITE_NETWORK=localnet
VITE_RPC_URL=http://localhost:9000
EOF
```

### 6. Restart Frontend (to pick up env vars)

```bash
docker-compose restart frontend
```

### 7. Open Application

Visit **http://localhost:5173** in your browser!

### 8. Get Test SUI

```bash
# Get your wallet address from browser extension
# Request test SUI from faucet
curl -X POST http://localhost:9123/gas \
  -H "Content-Type: application/json" \
  -d '{"FixedAmountRequest": {"recipient": "YOUR_WALLET_ADDRESS"}}'
```

---

## Manual Setup

### Step 1: Install Dependencies

#### Install Sui CLI

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

Verify installation:

```bash
sui --version
```

#### Install Node.js Dependencies

```bash
cd private-publishing-dapp
npm install
```

### Step 2: Start Sui Local Network

```bash
# Start local Sui network with faucet
sui start --force-regenesis --with-faucet
```

This starts:
- RPC server on http://localhost:9000
- Faucet on http://localhost:9123

**Keep this terminal open!**

### Step 3: Deploy Move Contracts

Open a new terminal:

```bash
cd move

# Build contracts
sui move build

# Publish to localnet
sui client publish --gas-budget 500000000
```

**Important:** Copy the Package ID from the output!

Example output:
```
Published Objects:
  Package ID: 0xabc123...
```

### Step 4: Configure Network

Edit `private-publishing-dapp/src/networkConfig.ts`:

```typescript
localnet: {
  url: "http://localhost:9000",
  variables: {
    packageId: "0xYOUR_PACKAGE_ID_HERE", // ← Update this!
  }
},
```

### Step 5: Start Frontend

```bash
cd ../private-publishing-dapp
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Step 6: Connect Wallet & Test

1. Install Sui Wallet browser extension
2. Switch to "Localnet" network in wallet settings
3. Get test SUI:
   ```bash
   sui client faucet --url http://localhost:9123
   ```
4. Visit http://localhost:5173
5. Connect wallet
6. Start creating publications!

---

## Configuration

### Environment Variables

**Frontend** (`private-publishing-dapp/.env`):

```bash
# Required
VITE_PACKAGE_ID=0x...                     # Deployed Move package ID
VITE_NETWORK=localnet                     # Network: localnet | devnet | testnet | mainnet

# Optional
VITE_RPC_URL=http://localhost:9000       # Custom RPC endpoint
VITE_FAUCET_URL=http://localhost:9123    # Faucet endpoint (localnet only)
```

### Network Configuration

Edit `private-publishing-dapp/src/networkConfig.ts`:

```typescript
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    localnet: {
      url: "http://localhost:9000",
      variables: {
        packageId: "0x...", // Your deployed package ID
      }
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: "0x...", // Devnet package ID
      }
    },
    // ... other networks
  });
```

### Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  sui-node:
    ports:
      - "9000:9000"  # RPC port
      - "9123:9123"  # Faucet port

  frontend:
    ports:
      - "5173:5173"  # Frontend port
    environment:
      - VITE_PACKAGE_ID=${PACKAGE_ID}
```

---

## Deployment

### Deploy to Testnet

1. **Switch Network:**
   ```bash
   sui client switch --env testnet
   ```

2. **Get Testnet SUI:**
   - Visit https://faucet.testnet.sui.io/
   - Request testnet SUI

3. **Publish Contracts:**
   ```bash
   cd move
   sui client publish --gas-budget 500000000
   ```

4. **Update Frontend Config:**
   ```typescript
   // networkConfig.ts
   defaultNetwork: "testnet"
   ```

5. **Build Frontend:**
   ```bash
   cd private-publishing-dapp
   npm run build
   ```

6. **Deploy to Hosting:**
   - Vercel: `vercel deploy`
   - Netlify: `netlify deploy`
   - AWS S3 + CloudFront

### Deploy to Mainnet

**⚠️ Warning: Mainnet deployment costs real SUI. Test thoroughly on testnet first!**

Same as testnet, but:
- Switch to mainnet: `sui client switch --env mainnet`
- Use mainnet faucet or purchase SUI
- Update config to use `defaultNetwork: "mainnet"`

---

## Troubleshooting

### Sui Network Issues

**Problem:** `sui start` fails with "Address already in use"

**Solution:**
```bash
# Kill existing Sui processes
pkill -f sui

# Restart
sui start --force-regenesis --with-faucet
```

**Problem:** Cannot connect to RPC

**Solution:**
```bash
# Check if Sui is running
curl http://localhost:9000

# Check ports
lsof -i :9000
lsof -i :9123
```

### Docker Issues

**Problem:** Containers won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Problem:** Port conflicts

**Solution:**
Edit `docker-compose.yml` to use different ports:
```yaml
ports:
  - "9001:9000"  # Use 9001 instead of 9000
```

### Frontend Issues

**Problem:** "Package ID not configured"

**Solution:**
1. Deploy Move contracts first
2. Copy Package ID from deployment output
3. Update `networkConfig.ts` with Package ID
4. Restart frontend

**Problem:** Wallet won't connect

**Solution:**
1. Install Sui Wallet extension
2. Switch to correct network (localnet/testnet/mainnet)
3. Get test funds from faucet
4. Refresh page and try again

**Problem:** Build fails with TypeScript errors

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Transaction Failures

**Problem:** "Insufficient gas"

**Solution:**
```bash
# Get more test SUI
sui client faucet

# Or increase gas budget in transaction
```

**Problem:** "Object not found"

**Solution:**
- Package ID may be incorrect
- Objects may not exist yet
- Network mismatch (check localnet vs testnet)

---

## Development Workflow

### 1. Update Smart Contracts

```bash
cd move

# Make changes to .move files

# Build and test
sui move build
sui move test

# Publish
sui client publish --gas-budget 500000000

# Update Package ID in frontend
```

### 2. Update Frontend

```bash
cd private-publishing-dapp

# Make changes

# Dev server (hot reload)
npm run dev

# Test build
npm run build
npm run preview
```

### 3. Test End-to-End

1. Deploy contracts
2. Update Package ID
3. Start frontend
4. Connect wallet
5. Test all user flows:
   - Create publication
   - Subscribe
   - Publish article
   - Read article
   - Manage subscriptions

---

## Service URLs

### Local Development

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React dApp |
| Sui RPC | http://localhost:9000 | Sui node RPC endpoint |
| Sui Faucet | http://localhost:9123 | Local faucet for test SUI |

### Testnet

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | (Your deployment URL) | Deployed dApp |
| Sui RPC | https://fullnode.testnet.sui.io | Testnet RPC |
| Faucet | https://faucet.testnet.sui.io | Testnet faucet |
| Explorer | https://testnet.suivision.xyz | Block explorer |

### Mainnet

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | (Your deployment URL) | Production dApp |
| Sui RPC | https://fullnode.mainnet.sui.io | Mainnet RPC |
| Explorer | https://suivision.xyz | Block explorer |

---

## Next Steps

1. ✅ Complete setup
2. 📚 Read [UI_BUILD_PLAN.md](./UI_BUILD_PLAN.md) for architecture
3. 🔄 Review [USER_FLOWS.md](./USER_FLOWS.md) for user journeys
4. 🧪 Run tests: `cd move && sui move test`
5. 🚀 Deploy to testnet
6. 🎨 Customize UI/branding
7. 🔐 Integrate Seal encryption (when available)
8. 💾 Integrate Walrus storage (when available)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/MystenLabs/sui)
- **Documentation:** [Sui Docs](https://docs.sui.io)
- **Discord:** [Sui Discord](https://discord.gg/sui)

---

**Status:** Ready for Development 🚀
**Last Updated:** 2025-10-24
