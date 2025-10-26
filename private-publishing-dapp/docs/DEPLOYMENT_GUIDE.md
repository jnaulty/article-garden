# Deployment and Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Configuration](#frontend-configuration)
5. [Walrus Setup](#walrus-setup)
6. [Seal Configuration](#seal-configuration)
7. [Testing the Deployment](#testing-the-deployment)
8. [Production Deployment](#production-deployment)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher
- **Sui CLI**: Latest version
- **Git**: For version control
- **Docker**: (Optional) For containerized deployment

### Required Accounts

- **Sui Wallet**: With testnet/mainnet SUI tokens
- **GitHub Account**: For repository access
- **Hosting Provider**: Vercel, Netlify, or similar

### Development Tools

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# Install pnpm
npm install -g pnpm

# Verify installations
sui --version
pnpm --version
node --version
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone [repository-url]
cd private-publishing-dapp
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install Move dependencies
cd move
sui move build
```

### 3. Configure Sui Client

```bash
# Add network configuration
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet

# Get test SUI tokens
sui client faucet

# Check active address
sui client active-address
```

### 4. Create Environment Files

Create `.env.local` in the frontend directory:

```env
# Network Configuration
VITE_SUI_NETWORK=testnet
VITE_FULLNODE_URL=https://fullnode.testnet.sui.io:443

# Package and Object IDs (filled after deployment)
VITE_PACKAGE_ID=
VITE_PUBLISHER_REGISTRY=
VITE_PUBLICATION_ADMIN_CAP=

# Walrus Configuration
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space

# Seal Configuration
VITE_SEAL_NETWORK=testnet
VITE_SEAL_KEY_SERVER_URL=https://seal-testnet.mystenlabs.com

# GraphQL Endpoint
VITE_GRAPHQL_ENDPOINT=https://sui-testnet.mystenlabs.com/graphql
```

---

## Smart Contract Deployment

### 1. Prepare the Move Package

```bash
cd move

# Update Move.toml with your package name
cat > Move.toml << 'EOF'
[package]
name = "private_publishing"
version = "1.0.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "mainnet" }

[addresses]
private_publishing = "0x0"
EOF
```

### 2. Build and Test

```bash
# Build the package
sui move build

# Run unit tests
sui move test

# Run specific test
sui move test -f test_create_publication
```

### 3. Deploy to Testnet

```bash
# Deploy with sufficient gas
sui client publish --gas-budget 100000000

# Save the output
# Transaction Digest: <DIGEST>
# Package ID: 0x<PACKAGE_ID>
# Created Objects:
#   - PublisherRegistry: 0x<REGISTRY_ID>
```

### 4. Save Deployment Information

Create `deployment.json`:

```json
{
  "network": "testnet",
  "packageId": "0x...",
  "publisherRegistry": "0x...",
  "transactionDigest": "...",
  "deployedAt": "2025-01-26T00:00:00Z",
  "deployer": "0x..."
}
```

### 5. Initialize the Platform

```bash
# Create initial publication (optional)
sui client call \
  --package 0x<PACKAGE_ID> \
  --module publication \
  --function create_publication \
  --args \
    '"Tech Blog"' \
    '"Latest technology articles"' \
    '"https://example.com/logo.png"' \
    5000000000 \
    10000000000 \
    '0x6' \
  --gas-budget 10000000
```

---

## Frontend Configuration

### 1. Update Environment Variables

Update `.env.local` with deployment values:

```env
VITE_PACKAGE_ID=0x... # From deployment
VITE_PUBLISHER_REGISTRY=0x... # From deployment
VITE_PUBLICATION_ADMIN_CAP=0x... # From create_publication
```

### 2. Configure Network Settings

Update `src/networkConfig.ts`:

```typescript
export const NETWORK_CONFIG = {
  testnet: {
    packageId: import.meta.env.VITE_PACKAGE_ID,
    publisherRegistry: import.meta.env.VITE_PUBLISHER_REGISTRY,
    fullnodeUrl: 'https://fullnode.testnet.sui.io:443',
    graphqlUrl: 'https://sui-testnet.mystenlabs.com/graphql',
  },
  mainnet: {
    packageId: '0x...', // Mainnet deployment
    publisherRegistry: '0x...',
    fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
    graphqlUrl: 'https://sui-mainnet.mystenlabs.com/graphql',
  }
};
```

### 3. Build the Frontend

```bash
# Development build
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

### 4. Test Wallet Connection

1. Install Sui Wallet extension
2. Create or import wallet
3. Switch to testnet
4. Connect wallet in the app
5. Verify connection status

---

## Walrus Setup

### 1. Configure Walrus Client

Update `src/services/walrus.ts`:

```typescript
import { WalrusClient } from '@mysten/walrus';
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

export function createWalrusClient(suiClient: SuiClient) {
  return new WalrusClient({
    network: 'testnet', // or 'mainnet'
    suiClient,
    wasmUrl: walrusWasmUrl,
  });
}
```

### 2. Configure Vite for WASM

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@mysten/walrus-wasm'],
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
```

### 3. Test Walrus Upload

```typescript
// Test upload function
async function testWalrusUpload() {
  const client = createWalrusClient(suiClient);
  const testData = new TextEncoder().encode('Hello Walrus!');

  const result = await uploadToWalrus(
    testData,
    suiClient,
    account.address,
    signAndExecute,
    1 // 1 epoch for testing
  );

  console.log('Upload successful:', result.blobId);
}
```

---

## Seal Configuration

### 1. Initialize Seal SDK

Update `src/services/seal.ts`:

```typescript
import { SealClient } from '@seal/sdk'; // Hypothetical SDK

export const sealClient = new SealClient({
  network: 'testnet',
  keyServerUrl: import.meta.env.VITE_SEAL_KEY_SERVER_URL,
});
```

### 2. Configure Encryption Policies

```typescript
export function createArticlePolicy(
  publicationId: string,
  articleId: string,
  tier: 'FREE' | 'BASIC' | 'PREMIUM'
) {
  return {
    type: 'SUBSCRIPTION_BASED',
    conditions: {
      publication: publicationId,
      article: articleId,
      minTier: tier,
    },
    keyServers: [
      'https://ks1.seal-testnet.mystenlabs.com',
      'https://ks2.seal-testnet.mystenlabs.com',
      'https://ks3.seal-testnet.mystenlabs.com',
    ],
    threshold: 2, // 2 of 3 key servers must agree
  };
}
```

### 3. Test Encryption/Decryption

```typescript
async function testSealEncryption() {
  const testContent = 'Secret article content';
  const policy = createArticlePolicy(pubId, articleId, 'BASIC');

  // Encrypt
  const { encryptedData, sealId } = await sealClient.encrypt(
    testContent,
    policy
  );

  // Decrypt (requires valid subscription)
  const decrypted = await sealClient.decrypt(
    encryptedData,
    sealId,
    subscriptionProof
  );

  console.log('Decrypted:', decrypted);
}
```

---

## Testing the Deployment

### 1. Smoke Tests

```bash
# Run automated smoke tests
cd private-publishing-dapp
pnpm test:e2e

# Manual smoke test checklist
- [ ] Wallet connects successfully
- [ ] Publications list loads
- [ ] Can create new publication (with admin cap)
- [ ] Can publish article
- [ ] Can purchase subscription
- [ ] Can read encrypted article
- [ ] Analytics track properly
```

### 2. Integration Tests

```typescript
// Test complete user flow
describe('User Journey', () => {
  it('should complete full reader journey', async () => {
    // 1. Browse publications
    await page.goto('/publications');
    await expect(page.locator('.publication-card')).toBeVisible();

    // 2. View publication
    await page.click('.publication-card');
    await expect(page.locator('.article-list')).toBeVisible();

    // 3. Purchase subscription
    await page.click('.subscribe-button');
    await wallet.approve();

    // 4. Read article
    await page.click('.article-card');
    await expect(page.locator('.article-content')).toBeVisible();
  });
});
```

### 3. Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://your-app.vercel.app \
  --output html \
  --output-path ./lighthouse-report.html

# Bundle size analysis
pnpm analyze
```

---

## Production Deployment

### 1. Mainnet Deployment Preparation

```bash
# Switch to mainnet
sui client switch --env mainnet

# Ensure sufficient SUI for gas
sui client balance

# Update Move.toml for mainnet
sed -i 's/testnet/mainnet/g' Move.toml
```

### 2. Deploy Smart Contracts to Mainnet

```bash
# Deploy with higher gas budget for mainnet
sui client publish --gas-budget 200000000

# Save mainnet deployment info
echo "MAINNET_PACKAGE_ID=0x..." >> .env.production
```

### 3. Frontend Production Build

```bash
# Create production env file
cat > .env.production << 'EOF'
VITE_SUI_NETWORK=mainnet
VITE_FULLNODE_URL=https://fullnode.mainnet.sui.io:443
VITE_PACKAGE_ID=0x...
VITE_PUBLISHER_REGISTRY=0x...
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus.space
VITE_SEAL_NETWORK=mainnet
VITE_GRAPHQL_ENDPOINT=https://sui-mainnet.mystenlabs.com/graphql
EOF

# Build for production
pnpm build
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_PACKAGE_ID production
vercel env add VITE_PUBLISHER_REGISTRY production
# ... add all env variables
```

### 5. Deploy to Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t private-publishing .
docker run -p 80:80 private-publishing
```

### 6. Configure CDN

```yaml
# cloudflare-config.yaml
zone: your-domain.com
routes:
  - pattern: "*.js"
    cache:
      ttl: 31536000
      browser_ttl: 31536000
  - pattern: "*.css"
    cache:
      ttl: 31536000
      browser_ttl: 31536000
  - pattern: "/api/*"
    cache:
      bypass: true
```

---

## Monitoring and Maintenance

### 1. Setup Monitoring

```typescript
// Add analytics
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### 2. Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

### 3. Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      sui: await checkSuiConnection(),
      walrus: await checkWalrusConnection(),
      seal: await checkSealConnection(),
    }
  };
  res.json(health);
});
```

### 4. Backup Procedures

```bash
# Backup deployment configuration
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${DATE}"

mkdir -p ${BACKUP_DIR}
cp .env.production ${BACKUP_DIR}/
cp deployment.json ${BACKUP_DIR}/
cp -r build ${BACKUP_DIR}/

# Upload to cloud storage
aws s3 cp ${BACKUP_DIR} s3://your-backup-bucket/${DATE}/ --recursive
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Wallet Connection Issues

**Problem**: Wallet won't connect
```typescript
// Solution: Check network mismatch
const checkNetwork = async () => {
  const walletNetwork = await wallet.getNetwork();
  const appNetwork = import.meta.env.VITE_SUI_NETWORK;

  if (walletNetwork !== appNetwork) {
    alert(`Please switch wallet to ${appNetwork}`);
  }
};
```

#### 2. Transaction Failures

**Problem**: Transactions fail with insufficient gas
```typescript
// Solution: Increase gas budget
const DEFAULT_GAS_BUDGET = 50000000; // 0.05 SUI

async function executeTransaction(tx) {
  return signAndExecute({
    transaction: tx,
    options: {
      showEffects: true,
      gasbudget: DEFAULT_GAS_BUDGET,
    }
  });
}
```

#### 3. Walrus Upload Failures

**Problem**: Large files fail to upload
```typescript
// Solution: Implement chunked upload
async function uploadLargeFile(file: File) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const chunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadChunk(chunk, i, chunks);
  }
}
```

#### 4. Seal Decryption Failures

**Problem**: Can't decrypt content despite valid subscription
```typescript
// Solution: Verify all requirements
async function debugDecryption(articleId: string) {
  // 1. Check subscription
  const sub = await getSubscription();
  console.log('Subscription:', sub);

  // 2. Check article access
  const hasAccess = await verifyAccess(articleId);
  console.log('Has Access:', hasAccess);

  // 3. Check key server connectivity
  const keyServers = await checkKeyServers();
  console.log('Key Servers:', keyServers);

  // 4. Check seal ID format
  const sealId = await getSealId(articleId);
  console.log('Seal ID:', sealId);
}
```

#### 5. GraphQL Query Failures

**Problem**: GraphQL queries timeout
```typescript
// Solution: Add retry logic
import { retry } from '@tanstack/react-query';

const queryWithRetry = retry(
  async () => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },
  {
    retries: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
);
```

### Debug Mode

Enable debug mode for troubleshooting:

```typescript
// Add to .env.local
VITE_DEBUG_MODE=true

// In your app
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  window.DEBUG = {
    sui: suiClient,
    walrus: walrusClient,
    seal: sealClient,
    logs: [],
  };

  console.log('Debug mode enabled. Access window.DEBUG for tools.');
}
```

### Support Channels

- **Documentation**: [Full documentation](./README.md)
- **GitHub Issues**: [Report bugs](https://github.com/...)
- **Discord**: [Community support](https://discord.gg/...)
- **Email**: support@example.com

---

## Security Checklist

Before going to production:

- [ ] All environment variables are properly set
- [ ] HTTPS is enabled
- [ ] CSP headers are configured
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive info
- [ ] Monitoring and alerting are configured
- [ ] Backup procedures are tested
- [ ] Incident response plan is documented
- [ ] Security audit has been performed

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check system health
- Review analytics

### Weekly
- Update dependencies
- Run security scans
- Backup configurations

### Monthly
- Performance audit
- Cost analysis
- User feedback review

### Quarterly
- Security audit
- Dependency updates
- Infrastructure review