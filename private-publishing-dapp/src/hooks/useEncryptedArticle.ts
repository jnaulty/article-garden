/**
 * Hooks for encrypted article publishing and reading
 * Integrates Seal encryption + Walrus storage + on-chain article creation
 */

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { useNetworkVariable } from '../networkConfig';
import { MODULES, SYSTEM_OBJECTS } from '../config/constants';
import { buildTarget } from '../utils/sui';
import { Tier } from '../types';
import { useSealSession } from '../providers/SealSessionProvider';
import { encryptArticleContent, decryptWithSubscription, decryptWithReadToken } from '../services/seal';
import { uploadToWalrus, fetchFromWalrus } from '../services/walrus';
import { logDebug, logInfo, logError } from '../utils/logger';

export interface PublishArticleParams {
  publicationId: string;
  publisherCapId: string;
  statsId: string;
  title: string;
  excerpt: string;
  content: string; // Plain text content
  tier: Tier;
}

export interface ReadArticleParams {
  article: {
    id: string;
    walrus_blob_id: string;
    seal_key_id: number[];
  };
  accessMethod: 'subscription' | 'token';
  subscriptionId?: string;
  readTokenId?: string;
}

/**
 * Hook to publish an encrypted article
 * Flow: Encrypt content -> Upload to Walrus -> Create on-chain article
 */
export function usePublishEncryptedArticle() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');
  const treasuryId = useNetworkVariable('treasuryId');
  const sealKeyServers = useNetworkVariable('sealKeyServers');
  const { sessionKey, isInitializing } = useSealSession();

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publishArticle = async (params: PublishArticleParams) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsPublishing(true);
    setError(null);

    try {
      // Step 1: Ensure Seal session is initialized
      // Note: The UI should prevent this by disabling publish button when !sessionReady
      if (!sessionKey) {
        throw new Error(
          'Seal session not initialized. Please initialize your session using the button above before publishing.'
        );
      }

      logInfo(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId },
        'Starting encryption and upload process'
      );

      // Step 2: Encrypt article content with Seal
      logDebug(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId },
        'Encrypting content with Seal'
      );

      // Generate a valid hex string ID for Seal encryption
      // Seal requires IDs to be hex strings (0-9, a-f only) without 0x prefix
      // See: src/services/seal.ts:118 comment and docs/seal-article-id-format.md
      const randomBytes = new Uint8Array(16); // 16 bytes = 128 bits
      crypto.getRandomValues(randomBytes);
      const articleIdForEncryption = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { encryptedData, metadata: sealMetadata } = await encryptArticleContent(
        params.content,
        articleIdForEncryption,
        packageId,
        [...sealKeyServers], // Convert readonly array to mutable
        suiClient,
        2 // Threshold: require 2 out of 2 key servers
      );

      logDebug(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId, threshold: sealMetadata.threshold },
        'Encryption complete'
      );

      // Step 3: Upload encrypted data to Walrus
      logDebug(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId, encryptedSize: encryptedData.length },
        'Uploading to Walrus'
      );

      // Use the flow-based upload API which is compatible with browser wallets
      // This passes the signAndExecute function so wallet popups work properly
      const uploadResult = await uploadToWalrus(
        encryptedData,
        suiClient,
        account.address,
        signAndExecute,
        5 // epochs (storage duration)
      );

      const walrusBlobId = uploadResult.blobId;

      logInfo(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId, blobId: walrusBlobId },
        `Walrus upload complete - blob ID: ${walrusBlobId}`
      );

      // Step 4: Create on-chain article object
      logDebug(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId, blobId: walrusBlobId },
        'Creating on-chain article'
      );
      const tx = new Transaction();

      // Convert seal metadata ID from hex string to bytes
      const sealKeyIdBytes = fromHex(sealMetadata.id);

      // Construct Tier enum via Move call
      const tierFunctionMap: Record<Tier, string> = {
        [Tier.Free]: 'create_tier_free',
        [Tier.Basic]: 'create_tier_basic',
        [Tier.Premium]: 'create_tier_premium',
      };

      const tierArg = tx.moveCall({
        target: buildTarget(packageId, MODULES.SUBSCRIPTION, tierFunctionMap[params.tier]),
        arguments: [],
      });

      // Split coins for article deposit (1% of premium price)
      // The Move contract will calculate the exact required amount
      const depositAmount = 1_000_000_000n; // 1 SUI as maximum deposit
      const [deposit] = tx.splitCoins(tx.gas, [tx.pure.u64(depositAmount)]);

      // Call publish_article function
      // Note: Article is now a shared object (not returned), so no transfer needed
      tx.moveCall({
        target: buildTarget(packageId, MODULES.ARTICLE, 'publish_article'),
        arguments: [
          tx.object(params.publicationId),
          tx.object(treasuryId),
          tx.object(params.publisherCapId),
          tx.pure.string(params.title),
          tx.pure.string(params.excerpt),
          tx.pure.string(walrusBlobId),
          tx.pure.vector('u8', sealKeyIdBytes),
          tierArg,
          tx.pure.u64(Date.now()), // published_at timestamp
          deposit,
        ],
      });

      // TODO: Analytics tracking - currently stubbed out
      // Record analytics would go here when analytics module is complete
      // tx.moveCall({
      //   target: buildTarget(packageId, MODULES.ANALYTICS, 'record_publication'),
      //   arguments: [
      //     tx.object(params.statsId),
      //   ],
      // });

      const result = await signAndExecute({
        transaction: tx,
      });

      logInfo(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId, blobId: walrusBlobId, txDigest: result.digest },
        'Article published successfully'
      );

      return {
        ...result,
        walrusBlobId,
        sealMetadata,
      };
    } catch (err) {
      logError(
        { context: 'ui', operation: 'publishArticle', publicationId: params.publicationId },
        'Failed to publish article',
        err instanceof Error ? err : new Error(String(err))
      );
      const error = err instanceof Error ? err : new Error('Failed to publish article');
      setError(error);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishArticle,
    isPublishing: isPublishing || isInitializing,
    error,
    sessionReady: !!sessionKey,
  };
}

/**
 * Hook to read an encrypted article
 * Flow: Fetch from Walrus -> Decrypt with Seal using access proof
 */
export function useReadEncryptedArticle() {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');
  const { sessionKey } = useSealSession();

  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const readArticle = async (params: ReadArticleParams): Promise<string> => {
    setIsReading(true);
    setError(null);

    try {
      // Step 1: Ensure Seal session is initialized
      if (!sessionKey) {
        throw new Error(
          'Seal session not initialized. Please initialize your session before reading articles.'
        );
      }

      logDebug(
        { context: 'ui', operation: 'readArticle', articleId: params.article.id, blobId: params.article.walrus_blob_id },
        'Fetching encrypted data from Walrus'
      );

      // Step 2: Fetch encrypted data from Walrus
      const encryptedData = await fetchFromWalrus(params.article.walrus_blob_id, suiClient);

      logDebug(
        { context: 'ui', operation: 'readArticle', articleId: params.article.id, accessMethod: params.accessMethod },
        `Decrypting with Seal using ${params.accessMethod} access`
      );

      // Step 2: Decrypt based on access method
      // The seal_key_id is already available in params.article
      let decryptedContent: string;

      if (params.accessMethod === 'subscription') {
        if (!params.subscriptionId) {
          throw new Error('Subscription ID required for subscription-based access');
        }

        decryptedContent = await decryptWithSubscription({
          encryptedData,
          sessionKey,
          suiClient,
          packageId,
          moduleName: 'seal_policy',
          subscriptionId: params.subscriptionId,
          articleId: params.article.id,
          sealKeyId: params.article.seal_key_id,
          clockId: SYSTEM_OBJECTS.CLOCK,
        });
      } else if (params.accessMethod === 'token') {
        if (!params.readTokenId) {
          throw new Error('Read token ID required for token-based access');
        }

        decryptedContent = await decryptWithReadToken({
          encryptedData,
          sessionKey,
          suiClient,
          packageId,
          moduleName: 'seal_policy',
          readTokenId: params.readTokenId,
          articleId: params.article.id,
          sealKeyId: params.article.seal_key_id,
          clockId: SYSTEM_OBJECTS.CLOCK,
        });
      } else {
        throw new Error(`Invalid access method: ${params.accessMethod}`);
      }

      logInfo(
        { context: 'ui', operation: 'readArticle', articleId: params.article.id, accessMethod: params.accessMethod },
        'Decryption successful'
      );
      return decryptedContent;
    } catch (err) {
      logError(
        { context: 'ui', operation: 'readArticle', articleId: params.article.id, accessMethod: params.accessMethod },
        'Failed to read article',
        err instanceof Error ? err : new Error(String(err))
      );
      const error = err instanceof Error ? err : new Error('Failed to read article');
      setError(error);
      throw error;
    } finally {
      setIsReading(false);
    }
  };

  return {
    readArticle,
    isReading,
    error,
    sessionReady: !!sessionKey,
  };
}

/**
 * Hook to generate a read token for pay-per-article access
 */
export function useGenerateReadToken() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable('packageId');
  const treasuryId = useNetworkVariable('treasuryId');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateToken = async (
    articleId: string,
    publicationId: string,
    paymentAmount: bigint
  ) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsGenerating(true);
    setError(null);

    try {
      const tx = new Transaction();

      // Split coins for payment
      const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)]);

      // Generate read token
      const [token] = tx.moveCall({
        target: buildTarget(packageId, MODULES.ACCESS_CONTROL, 'generate_read_token'),
        arguments: [
          tx.object(articleId),
          tx.object(publicationId),
          tx.object(treasuryId),
          payment,
          tx.object(SYSTEM_OBJECTS.CLOCK),
        ],
      });

      // Transfer token to sender
      tx.transferObjects([token], account.address);

      const result = await signAndExecute({
        transaction: tx,
      });

      logInfo(
        { context: 'ui', operation: 'generateReadToken', articleId, txDigest: result.digest },
        'Read token generated successfully'
      );
      return result;
    } catch (err) {
      logError(
        { context: 'ui', operation: 'generateReadToken', articleId },
        'Failed to generate read token',
        err instanceof Error ? err : new Error(String(err))
      );
      const error = err instanceof Error ? err : new Error('Failed to generate read token');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateToken,
    isGenerating,
    error,
  };
}
