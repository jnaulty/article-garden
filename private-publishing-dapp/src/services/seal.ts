/**
 * Seal encryption service
 *
 * Provides end-to-end encryption for article content using Seal protocol.
 * Encryption keys are managed by decentralized key servers and released
 * based on on-chain access control policies (subscription or read token).
 */

import { SealClient, SessionKey, EncryptedObject } from '@mysten/seal';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import { logDebug, logInfo, logError } from '../utils/logger';

// Cache SealClient instances per network
const sealClientCache = new Map<string, SealClient>();

export interface SealEncryptResult {
  encryptedData: Uint8Array; // BCS-serialized encrypted object
  backupKey?: string; // Optional symmetric key for disaster recovery
  metadata: {
    packageId: string;
    id: string; // Article ID
    threshold: number;
    services: string[]; // Key server object IDs
  };
}

export interface DecryptWithSubscriptionParams {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  suiClient: SuiClient;
  packageId: string;
  moduleName: string;
  subscriptionId: string;
  articleId: string;
  sealKeyId: number[]; // The seal_key_id from Article object (for validation)
  clockId: string;
}

export interface DecryptWithReadTokenParams {
  encryptedData: Uint8Array;
  sessionKey: SessionKey;
  suiClient: SuiClient;
  packageId: string;
  moduleName: string;
  readTokenId: string;
  articleId: string;
  sealKeyId: number[]; // The seal_key_id from Article object (for validation)
  clockId: string;
}

/**
 * Get or create SealClient for the given key servers using extension pattern
 *
 * Uses the deprecated asClientExtension() method which works with standard SuiClient
 * This ensures server configs are properly embedded in encrypted object metadata
 */
function getSealClient(
  suiClient: SuiClient,
  keyServerObjectIds: string[]
): SealClient {
  // Create cache key from server IDs (sorted for consistency)
  const cacheKey = [...keyServerObjectIds].sort().join('|');

  if (!sealClientCache.has(cacheKey)) {
    logDebug(
      { context: 'seal', operation: 'createClient', serverCount: keyServerObjectIds.length },
      `Creating new SealClient for ${keyServerObjectIds.length} key servers`
    );

    // Use asClientExtension() to create a seal extension
    const sealExtension = SealClient.asClientExtension({
      serverConfigs: keyServerObjectIds.map((objectId) => ({
        objectId,
        weight: 1,
      })),
      verifyKeyServers: false, // Skip verification for performance
    });

    // Register the extension with the SuiClient
    // The .register() method returns the SealClient instance directly, not an extended client
    const client = sealExtension.register(suiClient);

    logDebug(
      { context: 'seal', operation: 'createClient', clientType: typeof client, constructorName: client.constructor.name },
      `Successfully created SealClient for ${keyServerObjectIds.length} servers`
    );

    sealClientCache.set(cacheKey, client);
  }

  return sealClientCache.get(cacheKey)!;
}

/**
 * Encrypt article content with Seal
 *
 * @param content - Article content (plain text or JSON)
 * @param articleId - Unique article ID (used as encryption identity)
 * @param packageId - Move package ID containing seal_approve functions
 * @param keyServerObjectIds - Array of key server object IDs
 * @param suiClient - Sui client instance
 * @param threshold - Number of key servers required for decryption
 * @returns Encrypted data and metadata
 */
export async function encryptArticleContent(
  content: string,
  articleId: string,
  packageId: string,
  keyServerObjectIds: string[],
  suiClient: SuiClient,
  threshold: number = 2
): Promise<SealEncryptResult> {
  logInfo(
    { context: 'seal', operation: 'encrypt', articleId, packageId, serverCount: keyServerObjectIds.length, threshold },
    `Encrypting article ${articleId}`
  );

  // Validate inputs
  if (keyServerObjectIds.length === 0) {
    throw new Error('No key servers configured. Please configure Seal key servers in networkConfig.');
  }

  if (threshold > keyServerObjectIds.length) {
    throw new Error(`Threshold (${threshold}) cannot exceed number of key servers (${keyServerObjectIds.length})`);
  }

  // Get SealClient using extension pattern
  // Using asClientExtension() ensures server configs are properly embedded in encrypted metadata
  const client = getSealClient(suiClient, keyServerObjectIds);

  // Convert content to bytes
  const contentBytes = new TextEncoder().encode(content);

  // Encrypt with Seal
  // The extension pattern ensures server metadata is included in the encrypted object
  const { encryptedObject, key: backupKey } = await client.encrypt({
    threshold,
    packageId, // Can include 0x prefix when using extension pattern
    id: articleId, // Article ID for encryption identity
    data: contentBytes,
  });

  logInfo(
    { context: 'seal', operation: 'encrypt', articleId, encryptedSize: encryptedObject.length },
    `Encryption complete - ${encryptedObject.length} bytes`
  );

  logDebug(
    { context: 'seal', operation: 'encrypt', articleId },
    `Encrypted object first 100 bytes (hex): ${Array.from(encryptedObject.slice(0, 100))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`
  );

  // DEBUGGING: Parse the encrypted object to verify server metadata was embedded
  const parsedEncryptedObject = EncryptedObject.parse(encryptedObject);

  logDebug(
    {
      context: 'seal',
      operation: 'encrypt',
      articleId,
      verificationId: parsedEncryptedObject.id,
      verificationPackageId: parsedEncryptedObject.packageId,
      verificationThreshold: parsedEncryptedObject.threshold,
      servicesCount: parsedEncryptedObject.services.length
    },
    'Encrypted object verification complete'
  );

  if (parsedEncryptedObject.services.length === 0) {
    logError(
      { context: 'seal', operation: 'encrypt', articleId, inputServerCount: keyServerObjectIds.length },
      'WARNING: Encrypted object has NO server metadata - data will not be decryptable!',
      new Error('Missing server metadata')
    );
  } else {
    logInfo(
      { context: 'seal', operation: 'encrypt', articleId, serviceCount: parsedEncryptedObject.services.length },
      'Encryption successful with server metadata embedded'
    );
  }

  return {
    encryptedData: encryptedObject,
    backupKey: toHex(backupKey), // Optional: save for disaster recovery
    metadata: {
      packageId,
      id: articleId,
      threshold,
      services: keyServerObjectIds,
    },
  };
}

/**
 * Decrypt article content using subscription-based access
 *
 * Builds a transaction that calls seal_approve_subscription to verify access.
 * Key servers will execute this transaction to validate the user's subscription.
 *
 * @param params - Decryption parameters
 * @returns Decrypted article content
 */
export async function decryptWithSubscription(
  params: DecryptWithSubscriptionParams
): Promise<string> {
  const {
    encryptedData,
    sessionKey,
    suiClient,
    packageId,
    moduleName,
    subscriptionId,
    articleId,
    sealKeyId,
    clockId,
  } = params;

  logInfo(
    { context: 'seal', operation: 'decrypt', articleId, subscriptionId, encryptedSize: encryptedData.length },
    `Decrypting with subscription ${subscriptionId}`
  );

  logDebug(
    { context: 'seal', operation: 'decrypt', articleId, subscriptionId },
    `Encrypted data first 100 bytes (hex): ${Array.from(encryptedData.slice(0, 100))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`
  );

  // Parse encrypted object to get key server list
  const encryptedObject = EncryptedObject.parse(encryptedData);

  // Validate that the seal_key_id from Article matches the encrypted object ID
  const sealKeyIdHex = Array.from(new Uint8Array(sealKeyId))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (sealKeyIdHex !== encryptedObject.id) {
    const error = new Error(
      `Seal key ID mismatch: Article.seal_key_id (${sealKeyIdHex}) (${sealKeyId.toString()}) does not match encrypted object ID (${encryptedObject.id}). ` +
      `This indicates the encrypted blob does not correspond to this article.`
    );
    logError(
      { context: 'seal', operation: 'decrypt', articleId, sealKeyIdHex, encryptedObjectId: encryptedObject.id },
      'Seal key ID validation failed',
      error
    );
    throw error;
  }

  logDebug(
    { context: 'seal', operation: 'decrypt', articleId, sealKeyId: sealKeyIdHex },
    'Seal key ID validation passed'
  );

  logDebug(
    {
      context: 'seal',
      operation: 'decrypt',
      articleId,
      subscriptionId,
      parsedId: encryptedObject.id,
      parsedPackageId: encryptedObject.packageId,
      parsedThreshold: encryptedObject.threshold,
      servicesCount: encryptedObject.services.length
    },
    'Parsed encrypted object metadata'
  );

  const keyServerIds = encryptedObject.services.map(([objectId]) => objectId);

  // Validate server list is not empty
  if (keyServerIds.length === 0) {
    throw new Error(
      'Encrypted object contains no key server metadata. ' +
      'This article may have been encrypted incorrectly. ' +
      'Server list is required for decryption. ' +
      `Expected servers in encrypted object, got: ${JSON.stringify(encryptedObject.services)}`
    );
  }

  // Validate threshold is achievable
  if (encryptedObject.threshold > keyServerIds.length) {
    throw new Error(
      `Invalid encryption: threshold (${encryptedObject.threshold}) ` +
      `exceeds number of servers (${keyServerIds.length})`
    );
  }

  logDebug(
    { context: 'seal', operation: 'decrypt', articleId, subscriptionId, serverCount: keyServerIds.length },
    `Using ${keyServerIds.length} key servers`
  );

  // Get SealClient
  const client = getSealClient(suiClient, keyServerIds);

  // Build transaction that calls seal_approve_subscription
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${moduleName}::seal_approve_subscription`,
    arguments: [
      tx.pure.vector('u8', fromHex(encryptedObject.id)), // Article ID
      tx.object(subscriptionId), // SubscriptionNFT
      tx.object(articleId), // Article object
      tx.object(clockId), // Clock
    ],
  });

  logDebug({ context: 'seal', operation: 'decrypt', articleId, subscriptionId, sealKeyId: sealKeyIdHex }, 'Transaction built');

  // Build transaction bytes (onlyTransactionKind = true for seal_approve)
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  logDebug({ context: 'seal', operation: 'decrypt', articleId, subscriptionId, sealKeyId: sealKeyIdHex }, 'Transaction bytes built');

  // Decrypt with Seal
  const decryptedBytes = await client.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  });

  logDebug({ context: 'seal', operation: 'decrypt', articleId, subscriptionId, sealKeyId: sealKeyIdHex }, 'Decrypted bytes');

  // Convert bytes to string
  const content = new TextDecoder().decode(decryptedBytes);

  logInfo(
    { context: 'seal', operation: 'decrypt', articleId, subscriptionId, decryptedSize: content.length },
    'Decryption with subscription successful'
  );

  return content;
}

/**
 * Decrypt article content using read token access
 *
 * Builds a transaction that calls seal_approve_read_token to verify access.
 * Key servers will execute this transaction to validate the user's read token.
 *
 * @param params - Decryption parameters
 * @returns Decrypted article content
 */
export async function decryptWithReadToken(
  params: DecryptWithReadTokenParams
): Promise<string> {
  const {
    encryptedData,
    sessionKey,
    suiClient,
    packageId,
    moduleName,
    readTokenId,
    articleId,
    sealKeyId,
    clockId,
  } = params;

  logInfo(
    { context: 'seal', operation: 'decrypt', articleId, readTokenId },
    `Decrypting with read token ${readTokenId}`
  );

  // Parse encrypted object to get key server list
  const encryptedObject = EncryptedObject.parse(encryptedData);

  // Validate that the seal_key_id from Article matches the encrypted object ID
  const sealKeyIdHex = Array.from(new Uint8Array(sealKeyId))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (sealKeyIdHex !== encryptedObject.id) {
    const error = new Error(
      `Seal key ID mismatch: Article.seal_key_id (${sealKeyIdHex}) does not match encrypted object ID (${encryptedObject.id}). ` +
      `This indicates the encrypted blob does not correspond to this article.`
    );
    logError(
      { context: 'seal', operation: 'decrypt', articleId, sealKeyIdHex, encryptedObjectId: encryptedObject.id },
      'Seal key ID validation failed',
      error
    );
    throw error;
  }

  logDebug(
    { context: 'seal', operation: 'decrypt', articleId, sealKeyId: sealKeyIdHex },
    'Seal key ID validation passed'
  );

  logDebug(
    {
      context: 'seal',
      operation: 'decrypt',
      articleId,
      readTokenId,
      parsedId: encryptedObject.id,
      parsedPackageId: encryptedObject.packageId,
      parsedThreshold: encryptedObject.threshold,
      servicesCount: encryptedObject.services.length
    },
    'Parsed encrypted object metadata'
  );

  const keyServerIds = encryptedObject.services.map(([objectId]) => objectId);

  // Validate server list is not empty
  if (keyServerIds.length === 0) {
    throw new Error(
      'Encrypted object contains no key server metadata. ' +
      'This article may have been encrypted incorrectly. ' +
      'Server list is required for decryption. ' +
      `Expected servers in encrypted object, got: ${JSON.stringify(encryptedObject.services)}`
    );
  }

  // Validate threshold is achievable
  if (encryptedObject.threshold > keyServerIds.length) {
    throw new Error(
      `Invalid encryption: threshold (${encryptedObject.threshold}) ` +
      `exceeds number of servers (${keyServerIds.length})`
    );
  }

  logDebug(
    { context: 'seal', operation: 'decrypt', articleId, readTokenId, serverCount: keyServerIds.length },
    `Using ${keyServerIds.length} key servers`
  );

  // Get SealClient
  const client = getSealClient(suiClient, keyServerIds);

  // Build transaction that calls seal_approve_read_token
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${moduleName}::seal_approve_read_token`,
    arguments: [
      tx.pure.vector('u8', fromHex(encryptedObject.id)), // Article ID
      tx.object(readTokenId), // ReadToken
      tx.object(articleId), // Article object
      tx.object(clockId), // Clock
    ],
  });

  // Build transaction bytes (onlyTransactionKind = true for seal_approve)
  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  // Decrypt with Seal
  const decryptedBytes = await client.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  });

  // Convert bytes to string
  const content = new TextDecoder().decode(decryptedBytes);

  logInfo(
    { context: 'seal', operation: 'decrypt', articleId, readTokenId, decryptedSize: content.length },
    'Decryption with read token successful'
  );

  return content;
}

/**
 * Check if session is ready for encryption/decryption
 */
export function isSessionReady(sessionKey: SessionKey | null): boolean {
  return sessionKey !== null && !sessionKey.isExpired();
}

/**
 * Parse encrypted object metadata
 * Useful for displaying encryption info without decrypting
 */
export function parseEncryptedMetadata(encryptedData: Uint8Array): {
  id: string;
  packageId: string;
  threshold: number;
  services: string[];
} {
  const encryptedObject = EncryptedObject.parse(encryptedData);

  return {
    id: encryptedObject.id,
    packageId: encryptedObject.packageId,
    threshold: encryptedObject.threshold,
    services: encryptedObject.services.map(([objectId]) => objectId),
  };
}

/**
 * Clear the SealClient cache
 * Call this when switching networks
 */
export function clearSealClientCache(): void {
  sealClientCache.clear();
  logDebug({ context: 'seal', operation: 'clearCache' }, 'Client cache cleared');
}
