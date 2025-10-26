# Seal Integration Guide

## What is Seal?

**Seal** is Sui's encryption SDK that provides:
- End-to-end encryption for data
- Session-based key management
- Integration with Sui wallets
- No backend required

Perfect for our private publishing platform!

## Core Concepts

### 1. Session Keys

Session keys allow temporary decryption access without repeated signatures.

**Properties**:
- **TTL**: 30 minutes (configurable)
- **Scope**: Limited to specific package
- **Storage**: Browser localStorage
- **Signature**: Derived from wallet

### 2. Encryption Flow

```
Content → Seal.encrypt() → Encrypted Blob → Walrus
                ↓
           Encryption Key
                ↓
        Store on-chain (encrypted)
```

### 3. Decryption Flow

```
Walrus → Encrypted Blob → Seal.decrypt() → Content
              ↑
         Encryption Key
              ↑
      Fetch from on-chain
              ↑
         Session Key
```

## Installation

```bash
npm install @mysten/seal
```

## SessionKeyProvider Setup

Based on the Messaging SDK pattern:

```typescript
// providers/SessionKeyProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { SessionKey } from '@mysten/seal';

interface SessionKeyContextProps {
  sessionKey: SessionKey | null;
  isInitializing: boolean;
  error: Error | null;
  initializeSession: () => Promise<void>;
  clearSession: () => void;
}

const SessionKeyContext = createContext<SessionKeyContextProps | undefined>(undefined);

const PACKAGE_ID = 'YOUR_PACKAGE_ID';  // From deployment
const TTL_MINUTES = 30;

export const SessionKeyProvider = ({ children }: { children: ReactNode }) => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeSession = async () => {
    if (!currentAccount?.address) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Create session key
      const newSessionKey = await SessionKey.create({
        address: currentAccount.address,
        packageId: PACKAGE_ID,
        ttlMin: TTL_MINUTES,
        suiClient,
      });

      // Request signature from user
      const message = await signPersonalMessage({
        message: newSessionKey.getPersonalMessage(),
      });

      // Set signature on session key
      await newSessionKey.setPersonalMessageSignature(message.signature);

      // Save to localStorage
      localStorage.setItem(
        `sessionKey_${currentAccount.address}`,
        JSON.stringify(newSessionKey.export())
      );

      setSessionKey(newSessionKey);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create session'));
      setSessionKey(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const clearSession = () => {
    if (currentAccount?.address) {
      localStorage.removeItem(`sessionKey_${currentAccount.address}`);
      setSessionKey(null);
    }
  };

  // Load cached session on mount
  useEffect(() => {
    const loadCachedSession = async () => {
      if (!currentAccount?.address) return;

      const cached = localStorage.getItem(`sessionKey_${currentAccount.address}`);
      if (!cached) return;

      try {
        const restoredKey = SessionKey.import(JSON.parse(cached), suiClient);

        if (!restoredKey.isExpired()) {
          setSessionKey(restoredKey);
        } else {
          clearSession();
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        clearSession();
      }
    };

    loadCachedSession();
  }, [currentAccount?.address, suiClient]);

  return (
    <SessionKeyContext.Provider value={{
      sessionKey,
      isInitializing,
      error,
      initializeSession,
      clearSession,
    }}>
      {children}
    </SessionKeyContext.Provider>
  );
};

export const useSessionKey = () => {
  const context = useContext(SessionKeyContext);
  if (!context) {
    throw new Error('useSessionKey must be used within SessionKeyProvider');
  }
  return context;
};
```

## Encrypting Articles

```typescript
// lib/encryption.ts
import { SessionKey } from '@mysten/seal';

export async function encryptArticle(
  content: string,
  sessionKey: SessionKey
): Promise<{ encryptedBlob: Uint8Array; keyId: string }> {
  // Convert content to bytes
  const contentBytes = new TextEncoder().encode(content);

  // Encrypt with Seal
  const encrypted = await sessionKey.seal(contentBytes);

  return {
    encryptedBlob: encrypted.data,
    keyId: encrypted.keyId,
  };
}

export async function decryptArticle(
  encryptedBlob: Uint8Array,
  keyId: string,
  sessionKey: SessionKey
): Promise<string> {
  // Decrypt with Seal
  const decrypted = await sessionKey.unseal({
    data: encryptedBlob,
    keyId,
  });

  // Convert bytes to string
  return new TextDecoder().decode(decrypted);
}
```

## Publishing Flow

```typescript
// hooks/usePublishArticle.ts
import { useSessionKey } from '../providers/SessionKeyProvider';
import { useWalrus } from './useWalrus';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function usePublishArticle() {
  const { sessionKey } = useSessionKey();
  const { upload } = useWalrus();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const publish = async (
    publicationId: string,
    title: string,
    content: string,
    tier: 'Free' | 'Basic' | 'Premium'
  ) => {
    if (!sessionKey) {
      throw new Error('No session key available');
    }

    // Step 1: Encrypt content
    const { encryptedBlob, keyId } = await encryptArticle(content, sessionKey);

    // Step 2: Upload to Walrus
    const blobId = await upload(encryptedBlob);

    // Step 3: Create Article on-chain
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::article::publish_article`,
      arguments: [
        tx.pure.id(publicationId),
        tx.pure.string(title),
        tx.pure.string(content.substring(0, 200)), // Excerpt
        tx.pure.string(blobId),
        tx.pure.vector('u8', Array.from(keyId)),
        tx.pure.u8(tier === 'Free' ? 0 : tier === 'Basic' ? 1 : 2),
      ],
    });

    await signAndExecute({ transaction: tx });
  };

  return { publish };
}
```

## Reading Flow

```typescript
// hooks/useReadArticle.ts
import { useSessionKey } from '../providers/SessionKeyProvider';
import { useWalrus } from './useWalrus';
import { useSuiClientQuery } from '@mysten/dapp-kit';

export function useReadArticle(articleId: string) {
  const { sessionKey } = useSessionKey();
  const { download } = useWalrus();

  // Fetch article metadata
  const { data: article } = useSuiClientQuery('getObject', {
    id: articleId,
    options: { showContent: true },
  });

  const decryptAndRead = async () => {
    if (!sessionKey || !article) {
      throw new Error('Session or article not available');
    }

    // Extract metadata
    const content = article.data?.content;
    if (!content || !('fields' in content)) {
      throw new Error('Invalid article structure');
    }

    const fields = content.fields as Record<string, unknown>;
    const blobId = fields.walrus_blob_id as string;
    const keyId = fields.seal_key_id as number[];

    // Step 1: Download encrypted blob from Walrus
    const encryptedBlob = await download(blobId);

    // Step 2: Decrypt with Seal
    const decryptedContent = await decryptArticle(
      encryptedBlob,
      String.fromCharCode(...keyId),
      sessionKey
    );

    return decryptedContent;
  };

  return {
    article,
    decryptAndRead,
  };
}
```

## Session Management Best Practices

### 1. Auto-Refresh on Expiry

```typescript
useEffect(() => {
  if (!sessionKey) return;

  const checkExpiry = setInterval(() => {
    if (sessionKey.isExpired()) {
      console.log('Session expired, prompting refresh');
      setShowRefreshPrompt(true);
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkExpiry);
}, [sessionKey]);
```

### 2. Proactive Session Creation

```typescript
// On wallet connect, immediately prompt for session
useEffect(() => {
  if (currentAccount && !sessionKey && !isInitializing) {
    initializeSession();
  }
}, [currentAccount]);
```

### 3. Clear on Disconnect

```typescript
useEffect(() => {
  if (!currentAccount && sessionKey) {
    clearSession();
  }
}, [currentAccount]);
```

## Error Handling

### Common Errors

**1. Session Expired**
```typescript
if (sessionKey?.isExpired()) {
  toast.error('Session expired. Please refresh.');
  await initializeSession();
}
```

**2. Decryption Failed**
```typescript
try {
  await decryptArticle(blob, keyId, sessionKey);
} catch (err) {
  if (err.message.includes('invalid key')) {
    toast.error('You do not have access to this article');
  } else {
    toast.error('Failed to decrypt article');
  }
}
```

**3. No Session Key**
```typescript
if (!sessionKey) {
  return (
    <div>
      <p>Please create a session to read articles</p>
      <button onClick={initializeSession}>
        Create Session
      </button>
    </div>
  );
}
```

## Security Considerations

### 1. Never Store Raw Keys
❌ Don't store decryption keys in localStorage
✅ Store session keys (which are time-limited)

### 2. Session Scope
✅ Limit session to specific package ID
✅ Set reasonable TTL (30 minutes)

### 3. Signature Verification
✅ Always verify wallet signature
✅ Use Seal's built-in signature checking

### 4. Encrypted Storage
✅ Walrus stores encrypted blobs
✅ Keys stored encrypted on-chain
✅ No plaintext content anywhere

## Testing

### Unit Tests

```typescript
describe('Seal Encryption', () => {
  it('should encrypt and decrypt content', async () => {
    const content = 'Secret article content';
    const { encryptedBlob, keyId } = await encryptArticle(content, sessionKey);

    const decrypted = await decryptArticle(encryptedBlob, keyId, sessionKey);

    expect(decrypted).toBe(content);
  });

  it('should fail with wrong session key', async () => {
    const content = 'Secret';
    const { encryptedBlob, keyId } = await encryptArticle(content, sessionKey1);

    await expect(
      decryptArticle(encryptedBlob, keyId, sessionKey2)
    ).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Article Publishing', () => {
  it('should publish and read encrypted article', async () => {
    // Publish
    await publishArticle({
      title: 'Test Article',
      content: 'Private content',
      tier: 'Premium',
    });

    // Verify encrypted on Walrus
    const blob = await walrusClient.download(blobId);
    expect(() => new TextDecoder().decode(blob)).toThrow(); // Should be gibberish

    // Read with valid subscription
    const decrypted = await readArticle(articleId);
    expect(decrypted).toContain('Private content');
  });
});
```

## Performance Optimization

### 1. Lazy Decryption
Only decrypt when user actually views article, not on list view.

### 2. Caching
Cache decrypted articles in memory (not localStorage).

```typescript
const decryptedCache = new Map<string, string>();

const getDecrypted = async (articleId: string) => {
  if (decryptedCache.has(articleId)) {
    return decryptedCache.get(articleId)!;
  }

  const decrypted = await decryptAndRead(articleId);
  decryptedCache.set(articleId, decrypted);
  return decrypted;
};
```

### 3. Batch Decryption
When loading multiple articles, decrypt in parallel.

```typescript
const decryptMultiple = async (articleIds: string[]) => {
  return Promise.all(
    articleIds.map(id => decryptAndRead(id))
  );
};
```

## Debugging Tips

### Enable Seal Logging

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  SessionKey.setDebugMode(true);
}
```

### Session Key Inspector

```typescript
// Add to UI in dev mode
{process.env.NODE_ENV === 'development' && sessionKey && (
  <div>
    <p>Session expires: {new Date(sessionKey.expiresAt).toLocaleString()}</p>
    <p>Package: {sessionKey.packageId}</p>
    <p>Valid: {!sessionKey.isExpired() ? '✅' : '❌'}</p>
  </div>
)}
```

## Resources

- [Seal Documentation](https://seal-docs.wal.app/)
- [Seal GitHub](https://github.com/MystenLabs/seal-sdk)
- [Messaging SDK Example](https://github.com/MystenLabs/messaging-sdk-example)

---

**Seal makes encryption simple**: No key management complexity, integrated with Sui wallets, session-based access. Perfect for private publishing!
