/**
 * Walrus storage service
 * Uses WalrusClient SDK for decentralized blob storage
 *
 * Updated: 2025-10-24 - Corrected to use actual WalrusClient API
 * Updated: 2025-10-25 - Added WASM URL for Vite compatibility
 * Updated: 2025-10-25 - Refactored to use writeFilesFlow for browser compatibility
 * Updated: 2025-10-26 - Fixed quilt decryption by using SDK's BlobReader + QuiltReader
 */

import { WalrusClient, WalrusFile } from '@mysten/walrus';
import type { SuiClient } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
// Import WASM file with ?url suffix for Vite to serve it correctly
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';
import { logDebug, logInfo, logError } from '../utils/logger';

export interface WalrusUploadResult {
  blobId: string;
  size: number;
}

/**
 * Upload content to Walrus using browser-compatible flow API
 * Uses WalrusClient.writeFilesFlow() which is designed for browser environments
 * where wallet popups need to be triggered by direct user interactions.
 *
 * Flow Steps:
 * 1. encode() - Prepare files and generate blob ID (no signing)
 * 2. register() - Create transaction for on-chain registration (needs signing)
 * 3. upload() - Transfer data to storage nodes (no signing)
 * 4. certify() - Create transaction for on-chain certification (needs signing)
 *
 * @param content - Content blob to upload
 * @param suiClient - Sui client for certificate transactions
 * @param ownerAddress - Address that will own the blob (for paying storage fees)
 * @param signAndExecute - Function to sign and execute transactions (from dapp-kit)
 * @param epochs - Storage duration in epochs (default: 5)
 * @returns Blob ID and size
 */
export async function uploadToWalrus(
  content: Uint8Array,
  suiClient: SuiClient,
  ownerAddress: string,
  signAndExecute: (params: { transaction: Transaction }) => Promise<any>,
  epochs: number = 5
): Promise<WalrusUploadResult> {
  try {
    logInfo(
      { context: 'walrus', operation: 'upload', contentSize: content.length, epochs },
      'Starting browser-compatible upload flow'
    );

    // Initialize Walrus client with explicit WASM URL for Vite compatibility
    // Uses upload relay to avoid direct storage node access (~2,200 requests)
    const walrus = new WalrusClient({
      network: 'testnet',
      suiClient,
      wasmUrl: walrusWasmUrl,
      uploadRelay: {
        timeout: 600_000, // 10 minutes for large uploads
        host: 'https://upload-relay.testnet.walrus.space',
        sendTip: {
          max: 1_000, // Max tip in MIST for relay service
        },
      },
    });

    // Create WalrusFile from content
    // Use WalrusFile.from() static method with correct parameter names
    const file = WalrusFile.from({
      contents: content,
      identifier: 'encrypted-article.bin',
    });

    // Initialize the flow
    const flow = walrus.writeFilesFlow({ files: [file] });

    // Step 1: Encode the files
    logDebug({ context: 'walrus', operation: 'upload', step: 1 }, 'Step 1/4: Encoding files');
    await flow.encode();

    // Step 2: Register on-chain (requires signing)
    logDebug({ context: 'walrus', operation: 'upload', step: 2 }, 'Step 2/4: Registering on-chain');
    const registerTx = flow.register({
      epochs,
      owner: ownerAddress,
      deletable: true,
    });
    const registerResult = await signAndExecute({ transaction: registerTx });

    // Extract digest from the registration transaction result
    const digest = registerResult.digest;
    if (!digest) {
      throw new Error('Registration transaction did not return a digest');
    }
    logDebug({ context: 'walrus', operation: 'upload', txDigest: digest }, `Registration digest: ${digest}`);

    // Step 3: Upload to storage nodes (requires digest from registration)
    logDebug({ context: 'walrus', operation: 'upload', step: 3, txDigest: digest }, 'Step 3/4: Uploading to storage nodes');
    await flow.upload({ digest });

    // Step 4: Certify on-chain (requires signing)
    logDebug({ context: 'walrus', operation: 'upload', step: 4 }, 'Step 4/4: Certifying on-chain');
    const certifyTx = flow.certify();
    await signAndExecute({ transaction: certifyTx });

    // Get the uploaded files
    const files = await flow.listFiles();
    if (!files || files.length === 0) {
      throw new Error('No files were uploaded');
    }

    const uploadedFile = files[0];
    logInfo(
      { context: 'walrus', operation: 'upload', blobId: uploadedFile.blobId, size: content.length },
      `Upload successful - blob ID: ${uploadedFile.blobId}`
    );

    return {
      blobId: uploadedFile.blobId,
      size: content.length,
    };
  } catch (error) {
    logError(
      { context: 'walrus', operation: 'upload', contentSize: content.length },
      'Upload failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(`Failed to upload to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch and extract content from Walrus quilt blob
 *
 * Since we use writeFilesFlow() for upload, the content is stored in a "quilt"
 * container format with an embedded index. This function:
 * 1. Fetches the quilt blob from Walrus storage nodes
 * 2. Parses the embedded quilt index (via WalrusBlob.files())
 * 3. Extracts the specific file by identifier ('encrypted-article.bin')
 * 4. Returns the unwrapped file bytes (ready for Seal decryption)
 *
 * The quilt index is embedded at the start of the blob, so no external state
 * storage is required - everything is derived from the blobId.
 *
 * See: docs/WALRUS_QUILT_FIX.md for detailed explanation
 *
 * @param blobId - Blob ID from on-chain article data
 * @param suiClient - Sui client for Walrus operations
 * @returns Unwrapped file content (Seal EncryptedObject bytes)
 */
export async function fetchFromWalrus(
  blobId: string,
  suiClient: SuiClient
): Promise<Uint8Array> {
  try {
    logInfo({ context: 'walrus', operation: 'fetch', blobId }, `Fetching and parsing quilt blob: ${blobId}`);

    // Initialize Walrus client
    const walrus = new WalrusClient({
      network: 'testnet',
      suiClient,
      wasmUrl: walrusWasmUrl,
    });

    // Get the blob (internally creates BlobReader for storage node communication)
    const blob = await walrus.getBlob({ blobId });

    // Extract files from the quilt by filtering by identifier
    // This internally:
    // - Creates QuiltReader from BlobReader
    // - Reads the embedded quilt index
    // - Filters patches by identifier
    // - Returns WalrusFile instances
    const files = await blob.files({
      identifiers: ['encrypted-article.bin']
    });

    logDebug({ context: 'walrus', operation: 'fetch', blobId, fileCount: files.length }, `Found ${files.length} matching files`);

    if (files.length === 0) {
      throw new Error(
        'Encrypted article not found in quilt. File with identifier "encrypted-article.bin" not present.'
      );
    }

    // Extract the unwrapped file bytes (removes quilt container wrapping)
    const encryptedArticleFile = files[0];
    const fileBytes = await encryptedArticleFile.bytes();

    logInfo(
      { context: 'walrus', operation: 'fetch', blobId, fileSize: fileBytes.length },
      `Extracted file - ${fileBytes.length} bytes`
    );

    logDebug(
      { context: 'walrus', operation: 'fetch', blobId },
      `File first 100 bytes (hex): ${Array.from(fileBytes.slice(0, 100))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
    );

    return fileBytes;
  } catch (error) {
    logError(
      { context: 'walrus', operation: 'fetch', blobId },
      'Fetch failed',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error(
      `Failed to fetch from Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get blob metadata from Walrus
 *
 * @param blobId - Blob ID to check
 * @param suiClient - Sui client
 * @returns Blob metadata if exists
 */
export async function getBlobMetadata(
  blobId: string,
  suiClient: SuiClient
): Promise<{
  exists: boolean;
  blobId?: string;
  unencodedLength?: string;
}> {
  try {
    // Initialize Walrus client with explicit WASM URL for Vite compatibility
    // Uses upload relay to avoid direct storage node access (~2,200 requests)
    const walrus = new WalrusClient({
      network: 'testnet',
      suiClient,
      wasmUrl: walrusWasmUrl,
      uploadRelay: {
        timeout: 600_000, // 10 minutes for large uploads
        host: 'https://upload-relay.testnet.walrus.space',
        sendTip: {
          max: 1_000, // Max tip in MIST for relay service
        },
      },
    });

    // Get blob metadata from Walrus
    const metadata = await walrus.getBlobMetadata({
      blobId,
    });

    return {
      exists: true,
      blobId: metadata.blobId,
      unencodedLength: metadata.metadata.V1.unencoded_length,
    };
  } catch (error) {
    logError(
      { context: 'walrus', operation: 'getBlobMetadata', blobId },
      'Metadata fetch failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      exists: false,
    };
  }
}
