# Walrus Integration Guide

## What is Walrus?

**Walrus** is Sui's decentralized storage network designed for:
- Large blob storage (MB to GB)
- Redundant, censorship-resistant storage
- Integration with Sui blockchain
- Cost-effective for media/content

Perfect for storing encrypted articles!

## Why Walrus for Publishing?

| Feature | On-Chain | IPFS | Walrus |
|---------|----------|------|--------|
| **Cost** | 💰💰💰 Very expensive | 💰 Cheap | 💰 Cheap |
| **Integration** | ✅ Native | ❌ External | ✅ Native to Sui |
| **Permanence** | ✅ Forever | ⚠️ Needs pinning | ✅ Configurable |
| **Speed** | ⚡ Fast | 🐌 Variable | ⚡ Fast |
| **Privacy** | ❌ Public | ❌ Public | ✅ Encrypted possible |

## Architecture

```
Frontend
   ↓
Walrus Client
   ↓
┌──────────────────────────────────────┐
│     Walrus Storage Network            │
│  ┌─────────┐  ┌─────────┐  ┌──────┐ │
│  │ Node 1  │  │ Node 2  │  │Node N│ │
│  └─────────┘  └─────────┘  └──────┘ │
│        Erasure Coded Redundancy      │
└──────────────────────────────────────┘
   ↓
Blob ID (stored on-chain)
```

## Installation

### 1. Install Walrus CLI (for testing)

```bash
# Download Walrus CLI
curl -fsSL https://storage.googleapis.com/mysten-walrus-binaries/walrus-testnet-latest-ubuntu-x86_64 -o walrus
chmod +x walrus
sudo mv walrus /usr/local/bin/

# Verify installation
walrus --version
```

### 2. Configure Walrus

```bash
# Create config directory
mkdir -p ~/.walrus

# Initialize config (uses testnet by default)
walrus init
```

### 3. Install SDK

```bash
npm install @mysten/walrus-sdk
```

## Getting WAL Tokens

WAL tokens are required to pay for Walrus storage operations. Here's how to get and manage them:

### Getting WAL from Faucet

For testnet, you can get WAL tokens using the `walrus` CLI:

```bash
# Request WAL tokens from the testnet faucet
walrus get-wal

# This will send WAL tokens to your active Sui wallet address
# Default location: ~/.sui/sui_config/client.yaml
```

The faucet typically provides **1 WAL** per request, which is split into multiple coin objects (e.g., 2x 0.5 WAL).

### Checking Your WAL Balance

```bash
# View all your wallet objects (including WAL tokens)
sui client objects

# Or search specifically for WAL tokens
sui client objects --json | grep -A 20 "WAL"
```

WAL tokens appear as:
```
type: "0x2::coin::Coin<0x8190...::wal::WAL>"
balance: "500000000"  # 0.5 WAL (9 decimals)
```

### Sending WAL to Another Address

Transfer WAL tokens to a web wallet or another address:

**Option 1: Using the convenience script (recommended)**
```bash
# Interactive transfer with confirmation
./scripts/send-wal.sh

# Or specify a custom recipient
./scripts/send-wal.sh 0xYOUR_RECIPIENT_ADDRESS

# For automation (no confirmation)
./scripts/send-wal-auto.sh
```

See [WAL Scripts README](../scripts/WAL_SCRIPTS_README.md) for detailed documentation.

**Option 2: Manual transfer**
```bash
# Transfer a WAL token object to another address
sui client transfer \
  --object-id <WAL_OBJECT_ID> \
  --to <RECIPIENT_ADDRESS> \
  --gas-budget 10000000

# Example:
sui client transfer \
  --object-id 0x90152cdf9199029777f77cef05a5cae779b21ca9820d10e125d511e12453bebc \
  --to 0x652a9c2199ec35e9358f663595ba9ef38b6a297111e6f8045eb496c1a117dfa1 \
  --gas-budget 10000000
```

### Merging WAL Coins

If you have multiple small WAL coin objects, you can merge them:

```bash
# Merge multiple WAL coins into one
sui client merge-coin \
  --primary-coin <PRIMARY_WAL_OBJECT_ID> \
  --coin-to-merge <WAL_OBJECT_TO_MERGE_ID> \
  --gas-budget 10000000
```

### Common Commands Reference

| Command | Description |
|---------|-------------|
| `walrus get-wal` | Request WAL from testnet faucet |
| `sui client objects` | View all wallet objects |
| `sui client gas` | View SUI gas coins |
| `sui client transfer --object-id <ID> --to <ADDR>` | Send WAL to another address |
| `sui client merge-coin --primary-coin <ID> --coin-to-merge <ID>` | Combine WAL coins |

### WAL Token Details

- **Token Type**: `0x8190b041122eb492bf63cb464476bd68c6b7e570a4079645a8b28732b6197a82::wal::WAL`
- **Decimals**: 9
- **Display**: 1 WAL = 1,000,000,000 (raw units)
- **Network**: Sui Testnet (for development)

### Troubleshooting

**"Insufficient WAL balance"**
- Run `walrus get-wal` to request more tokens
- Check balance with `sui client objects`

**"Object not found"**
- Verify the object ID is correct
- Ensure the object hasn't been spent/transferred

**"Gas budget too low"**
- Increase `--gas-budget` to at least 10000000 (0.01 SUI)

## Frontend Integration

### Walrus Client Setup

```typescript
// lib/walrus-client.ts
import { WalrusClient } from '@mysten/walrus-sdk';

export const walrusClient = new WalrusClient({
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  publisher: 'https://publisher.walrus-testnet.walrus.space',
});

export async function uploadToWalrus(data: Uint8Array): Promise<string> {
  try {
    const result = await walrusClient.store(data, {
      epochs: 5, // Store for 5 epochs (~5 months on testnet)
    });

    return result.blobId;
  } catch (error) {
    console.error('Walrus upload failed:', error);
    throw new Error('Failed to upload to Walrus');
  }
}

export async function downloadFromWalrus(blobId: string): Promise<Uint8Array> {
  try {
    const data = await walrusClient.read(blobId);
    return data;
  } catch (error) {
    console.error('Walrus download failed:', error);
    throw new Error('Failed to download from Walrus');
  }
}
```

### Upload Hook

```typescript
// hooks/useWalrus.ts
import { useState } from 'react';
import { uploadToWalrus, downloadFromWalrus } from '../lib/walrus-client';

export function useWalrus() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (data: Uint8Array): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      const blobId = await uploadToWalrus(data);
      return blobId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const download = async (blobId: string): Promise<Uint8Array> => {
    setIsDownloading(true);
    setError(null);

    try {
      const data = await downloadFromWalrus(blobId);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    upload,
    download,
    isUploading,
    isDownloading,
    error,
  };
}
```

## Publishing Workflow

### Complete Upload Flow

```typescript
// Example: Publishing an article

async function publishArticleToWalrus(
  title: string,
  content: string,
  sessionKey: SessionKey
) {
  // Step 1: Encrypt content with Seal
  const { encryptedBlob, keyId } = await encryptArticle(content, sessionKey);

  // Step 2: Upload encrypted blob to Walrus
  const blobId = await uploadToWalrus(encryptedBlob);

  // Step 3: Store metadata on-chain
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::article::publish`,
    arguments: [
      tx.pure.string(title),
      tx.pure.string(blobId),        // Walrus blob ID
      tx.pure.vector('u8', keyId),   // Seal key ID
    ],
  });

  await signAndExecute({ transaction: tx });

  return blobId;
}
```

### Complete Download Flow

```typescript
// Example: Reading an article

async function readArticleFromWalrus(
  articleId: string,
  sessionKey: SessionKey
) {
  // Step 1: Fetch article metadata from blockchain
  const article = await suiClient.getObject({
    id: articleId,
    options: { showContent: true },
  });

  const fields = article.data?.content?.fields;
  const blobId = fields.walrus_blob_id;
  const keyId = fields.seal_key_id;

  // Step 2: Download encrypted blob from Walrus
  const encryptedBlob = await downloadFromWalrus(blobId);

  // Step 3: Decrypt with Seal
  const decryptedContent = await decryptArticle(
    encryptedBlob,
    keyId,
    sessionKey
  );

  return decryptedContent;
}
```

## Storage Epochs

### Understanding Epochs

Walrus storage is epoch-based:
- **1 epoch** ≈ 1 month (testnet/mainnet may vary)
- **Minimum storage**: 1 epoch
- **Maximum storage**: 500 epochs (~41 years)

### Setting Storage Duration

```typescript
// Short-term (preview articles)
await walrusClient.store(data, { epochs: 1 });

// Medium-term (regular articles)
await walrusClient.store(data, { epochs: 12 }); // ~1 year

// Long-term (permanent archive)
await walrusClient.store(data, { epochs: 500 }); // Max
```

### Extending Storage

```typescript
// Extend existing blob's storage duration
await walrusClient.extend(blobId, {
  additionalEpochs: 12, // Add 1 year
});
```

## Cost Management

### Estimating Costs

```typescript
// Get current storage price per MB per epoch
const price = await walrusClient.getStoragePrice();

// Calculate cost for article
const articleSizeMB = encryptedBlob.length / (1024 * 1024);
const epochs = 12; // 1 year
const estimatedCost = price * articleSizeMB * epochs;

console.log(`Storage cost: ${estimatedCost} SUI`);
```

### Optimizing Costs

**1. Compress Before Encrypt**
```typescript
import pako from 'pako';

// Compress markdown content
const compressed = pako.deflate(contentBytes);

// Then encrypt
const encrypted = await sessionKey.seal(compressed);

// Upload
await upload(encrypted.data);

// On read: decrypt → decompress
const decrypted = await sessionKey.unseal(encryptedBlob);
const decompressed = pako.inflate(decrypted, { to: 'string' });
```

**2. Separate Media**
```typescript
// Store text on Walrus (small)
const textBlobId = await upload(encryptedText);

// Store images separately with shorter duration
const imageBlobId = await upload(encryptedImage, { epochs: 6 });
```

**3. Tiered Storage**
```typescript
// Free tier articles: 3 months
if (tier === 'Free') {
  epochs = 3;
}

// Premium articles: 2 years
if (tier === 'Premium') {
  epochs = 24;
}
```

## Handling Large Files

### Chunked Upload

For articles >10MB:

```typescript
async function uploadLargeArticle(content: Uint8Array) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const chunks: string[] = [];

  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    const chunk = content.slice(i, i + CHUNK_SIZE);
    const blobId = await uploadToWalrus(chunk);
    chunks.push(blobId);
  }

  // Store chunk manifest on-chain
  return chunks;
}
```

### Progress Tracking

```typescript
export function useWalrusUpload() {
  const [progress, setProgress] = useState(0);

  const uploadWithProgress = async (data: Uint8Array) => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await uploadToWalrus(chunk);

      setProgress(((i + 1) / totalChunks) * 100);
    }
  };

  return { uploadWithProgress, progress };
}
```

## Error Handling

### Network Failures

```typescript
async function uploadWithRetry(
  data: Uint8Array,
  maxRetries = 3
): Promise<string> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToWalrus(data);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError!;
}
```

### Download Failures

```typescript
async function downloadWithFallback(blobId: string): Promise<Uint8Array> {
  try {
    // Try primary aggregator
    return await walrusClient.read(blobId);
  } catch (primaryError) {
    console.warn('Primary aggregator failed, trying fallback');

    // Try fallback aggregator
    const fallbackClient = new WalrusClient({
      aggregator: 'https://fallback-aggregator.walrus.space',
    });

    return await fallbackClient.read(blobId);
  }
}
```

## Caching Strategy

### Browser Cache

```typescript
// Cache downloaded blobs in IndexedDB
import { openDB } from 'idb';

const dbPromise = openDB('walrus-cache', 1, {
  upgrade(db) {
    db.createObjectStore('blobs');
  },
});

async function getCachedBlob(blobId: string): Promise<Uint8Array | null> {
  const db = await dbPromise;
  return db.get('blobs', blobId);
}

async function cacheBlob(blobId: string, data: Uint8Array): Promise<void> {
  const db = await dbPromise;
  await db.put('blobs', data, blobId);
}

// Use cache
async function downloadWithCache(blobId: string): Promise<Uint8Array> {
  // Check cache first
  const cached = await getCachedBlob(blobId);
  if (cached) {
    return cached;
  }

  // Download and cache
  const data = await downloadFromWalrus(blobId);
  await cacheBlob(blobId, data);
  return data;
}
```

## Monitoring

### Track Storage Usage

```typescript
// Store storage metrics on-chain
public struct StorageMetrics has key {
    id: UID,
    publication_id: ID,
    total_blobs: u64,
    total_bytes: u64,
    total_cost_sui: u64,
}

// Update on each publish
public fun record_storage(
    metrics: &mut StorageMetrics,
    blob_size: u64,
    cost: u64
) {
    metrics.total_blobs = metrics.total_blobs + 1;
    metrics.total_bytes = metrics.total_bytes + blob_size;
    metrics.total_cost_sui = metrics.total_cost_sui + cost;
}
```

### Dashboard Queries

```typescript
// Get publication's storage stats
const metrics = await suiClient.getObject({
  id: storageMetricsId,
  options: { showContent: true },
});

const { total_blobs, total_bytes, total_cost_sui } = metrics.data.content.fields;

console.log(`
  Total articles: ${total_blobs}
  Total storage: ${(total_bytes / 1024 / 1024).toFixed(2)} MB
  Total cost: ${total_cost_sui / 1e9} SUI
`);
```

## Testing

### Local Testing

```typescript
// Mock Walrus for local development
class MockWalrusClient {
  private storage = new Map<string, Uint8Array>();

  async store(data: Uint8Array): Promise<{ blobId: string }> {
    const blobId = crypto.randomUUID();
    this.storage.set(blobId, data);
    return { blobId };
  }

  async read(blobId: string): Promise<Uint8Array> {
    const data = this.storage.get(blobId);
    if (!data) throw new Error('Blob not found');
    return data;
  }
}

// Use in tests
const walrusClient = process.env.NODE_ENV === 'test'
  ? new MockWalrusClient()
  : new WalrusClient({ ... });
```

### Integration Tests

```typescript
describe('Walrus Integration', () => {
  it('should upload and download article', async () => {
    const content = 'Test article content';
    const bytes = new TextEncoder().encode(content);

    // Upload
    const blobId = await uploadToWalrus(bytes);
    expect(blobId).toBeTruthy();

    // Download
    const downloaded = await downloadFromWalrus(blobId);
    const decoded = new TextDecoder().decode(downloaded);

    expect(decoded).toBe(content);
  });
});
```

## Best Practices

### 1. Always Encrypt Before Upload
```typescript
// ❌ Don't upload plaintext
await upload(articleBytes);

// ✅ Encrypt first
const encrypted = await seal(articleBytes);
await upload(encrypted);
```

### 2. Store Blob IDs On-Chain
```typescript
// ✅ Blob IDs in Article objects
public struct Article has key {
    id: UID,
    walrus_blob_id: String,  // Reference to Walrus
    // ...
}
```

### 3. Handle Missing Blobs Gracefully
```typescript
try {
  return await download(blobId);
} catch (error) {
  if (error.message.includes('not found')) {
    return showArchiveMessage();
  }
  throw error;
}
```

### 4. Set Appropriate Epochs
```typescript
// Consider article importance
const epochs = isPermanentArchive ? 500 : 12;
```

## Resources

- [Walrus Documentation](https://docs.walrus.site/)
- [Walrus Testnet](https://walrus-testnet.walrus.space/)
- [Storage Economics](https://docs.walrus.site/usage/storage-pricing.html)

---

**Walrus makes decentralized storage simple**: No IPFS complexity, native Sui integration, built for blobs. Perfect for encrypted articles!
