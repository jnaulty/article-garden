/**
 * ArticleReader Component
 * Decrypts and displays encrypted articles using Seal + Walrus
 */

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Heading,
  Text,
  Button,
  Card,
  Flex,
  Box,
  Callout,
  Badge,
  Separator,
} from '@radix-ui/themes';
import {
  InfoCircledIcon,
  LockClosedIcon,
  LockOpen1Icon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { useReadEncryptedArticle } from '../../hooks/useEncryptedArticle';
import { useSealSession } from '../../providers/SealSessionProvider';
import { Article, Tier } from '../../types';
import { PRICING } from '../../config/constants';
import { logger } from '../../utils/logger';
import { saveReadingProgress } from '../../utils/readingProgress';
import { useDebounce } from '../../hooks/useDebounce';

export interface ArticleReaderProps {
  article: Article;
  subscriptionId?: string;
  readTokenId?: string;
  onPurchaseToken?: () => void;
  onSubscribe?: () => void;
}

const TIER_COLORS: Record<Tier, 'gray' | 'blue' | 'purple'> = {
  [Tier.Free]: 'gray',
  [Tier.Basic]: 'blue',
  [Tier.Premium]: 'purple',
};

const TIER_NAMES: Record<Tier, string> = {
  [Tier.Free]: 'Free',
  [Tier.Basic]: 'Basic',
  [Tier.Premium]: 'Premium',
};

export function ArticleReader({
  article,
  subscriptionId,
  readTokenId,
  onPurchaseToken,
  onSubscribe,
}: ArticleReaderProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { readArticle, isReading, error, sessionReady } = useReadEncryptedArticle();
  const { initializeSession, isInitializing } = useSealSession();

  const hasAccess = !!subscriptionId || !!readTokenId;
  const accessMethod = subscriptionId ? 'subscription' : readTokenId ? 'token' : null;

  // Debounced progress for saving (avoid excessive localStorage writes)
  const debouncedProgress = useDebounce(scrollProgress, 1000);

  // Auto-decrypt when access is available
  useEffect(() => {
    if (hasAccess && sessionReady && !decryptedContent && !isDecrypting) {
      handleDecrypt();
    }
  }, [hasAccess, sessionReady]);

  // Scroll tracking effect
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;

      if (scrollableHeight === 0) {
        setScrollProgress(100);
        return;
      }

      const progress = Math.round((scrollTop / scrollableHeight) * 100);
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [decryptedContent]);

  // Save progress effect (debounced)
  useEffect(() => {
    if (debouncedProgress > 0 && decryptedContent) {
      saveReadingProgress(article.id, debouncedProgress);
    }
  }, [debouncedProgress, article.id, decryptedContent]);

  const handleDecrypt = async () => {
    if (!hasAccess || !accessMethod) {
      logger.warn({
        context: 'ArticleReader',
        operation: 'decrypt',
        articleId: article.id,
        hasAccess,
        accessMethod
      }, 'No access method available');
      return;
    }

    setIsDecrypting(true);

    try {
      const content = await readArticle({
        article: {
          id: article.id,
          walrus_blob_id: article.walrus_blob_id,
          seal_key_id: article.seal_key_id,
        },
        accessMethod,
        subscriptionId,
        readTokenId,
      });

      setDecryptedContent(content);
    } catch (err) {
      logger.error({
        context: 'ArticleReader',
        operation: 'decrypt',
        error: err,
        articleId: article.id
      }, 'Decryption failed');
      // Error is handled by the hook
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleInitializeSession = async () => {
    try {
      await initializeSession();
    } catch (err) {
      logger.error({
        context: 'ArticleReader',
        operation: 'initialize_session',
        error: err
      }, 'Session initialization failed');
    }
  };

  const calculateDailyPrice = (tier: Tier): bigint => {
    if (tier === Tier.Free) return 0n;
    const monthlyPrice = tier === Tier.Basic ? PRICING.BASIC_MONTHLY : PRICING.PREMIUM_MONTHLY;
    return monthlyPrice / 30n;
  };

  return (
    <Container size="3" ref={contentRef}>
      {/* Reading Progress Bar - Fixed at top */}
      {decryptedContent && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--gray-a3)',
            zIndex: 1000,
          }}
        >
          <Box
            style={{
              width: `${scrollProgress}%`,
              height: '100%',
              background: 'var(--accent-9)',
              transition: 'width 0.2s ease-out',
            }}
          />
        </Box>
      )}

      <Card size="4">
        <Flex direction="column" gap="4">
          {/* Article Header */}
          <Box>
            <Flex justify="between" align="start" mb="2">
              <Heading size="7">{article.title}</Heading>
              <Badge color={TIER_COLORS[article.tier]} size="2">
                {TIER_NAMES[article.tier]}
              </Badge>
            </Flex>

            {article.excerpt && (
              <Text color="gray" size="3">
                {article.excerpt}
              </Text>
            )}

            <Flex gap="2" mt="3">
              <Text size="1" color="gray">
                Published: {new Date(Number(article.published_at) * 1000).toLocaleDateString()}
              </Text>
              {article.is_archived && (
                <Badge color="orange" size="1">
                  Archived
                </Badge>
              )}
            </Flex>
          </Box>

          <Separator size="4" />

          {/* Access Status */}
          {!sessionReady && (
            <Callout.Root color="blue">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Initialize your Seal session to decrypt this article.
                <Box mt="2">
                  <Button size="1" onClick={handleInitializeSession} disabled={isInitializing}>
                    {isInitializing ? 'Initializing...' : 'Initialize Seal Session'}
                  </Button>
                </Box>
              </Callout.Text>
            </Callout.Root>
          )}

          {/* No Access - Show Purchase Options */}
          {!hasAccess && sessionReady && (
            <Callout.Root color="amber">
              <Callout.Icon>
                <LockClosedIcon />
              </Callout.Icon>
              <Callout.Text>
                <Box mb="2">
                  <Text weight="bold">
                    This article is encrypted
                  </Text>
                </Box>
                <Box mb="3">
                  <Text size="2" color="gray">
                    Subscribe or purchase a 24-hour read token to access this content.
                  </Text>
                </Box>
                <Flex gap="2">
                  {onSubscribe && (
                    <Button size="2" onClick={onSubscribe}>
                      Subscribe
                    </Button>
                  )}
                  {onPurchaseToken && article.tier !== Tier.Free && (
                    <Button size="2" variant="soft" onClick={onPurchaseToken}>
                      Buy Token ({(calculateDailyPrice(article.tier) / 1_000_000_000n).toString()} SUI for 24h)
                    </Button>
                  )}
                </Flex>
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Has Access - Show Decrypt Button or Content */}
          {hasAccess && sessionReady && (
            <>
              {!decryptedContent && !isDecrypting && (
                <Callout.Root color="green">
                  <Callout.Icon>
                    <LockOpen1Icon />
                  </Callout.Icon>
                  <Callout.Text>
                    <Box mb="2">
                      <Text weight="bold">
                        Access granted
                      </Text>
                    </Box>
                    <Box mb="3">
                      <Text size="2" color="gray">
                        You have {accessMethod === 'subscription' ? 'subscription' : 'token'} access to this article.
                      </Text>
                    </Box>
                    <Button size="2" onClick={handleDecrypt}>
                      <LockOpen1Icon />
                      Decrypt & Read
                    </Button>
                  </Callout.Text>
                </Callout.Root>
              )}

              {(isDecrypting || isReading) && (
                <Callout.Root>
                  <Callout.Icon>
                    <ReloadIcon className="animate-spin" />
                  </Callout.Icon>
                  <Callout.Text>
                    <Box mb="1">
                      <Text weight="bold">
                        Decrypting article...
                      </Text>
                    </Box>
                    <Text size="1" color="gray">
                      Fetching from Walrus and decrypting with Seal
                    </Text>
                  </Callout.Text>
                </Callout.Root>
              )}

              {/* Decrypted Content */}
              {decryptedContent && (
                <Box>
                  <Flex justify="between" align="center" mb="3">
                    <Badge color="green" size="2">
                      <LockOpen1Icon />
                      Decrypted
                    </Badge>
                    <Button size="1" variant="soft" onClick={handleDecrypt}>
                      <ReloadIcon />
                      Refresh
                    </Button>
                  </Flex>

                  <Card>
                    <Box p="4">
                      <Text
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.8',
                          fontSize: '16px',
                        }}
                      >
                        {decryptedContent}
                      </Text>
                    </Box>
                  </Card>
                </Box>
              )}
            </>
          )}

          {/* Error Display */}
          {error && (
            <Callout.Root color="red">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                <Box mb="1">
                  <Text weight="bold">
                    Decryption failed
                  </Text>
                </Box>
                <Text size="2">{error.message}</Text>
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Encryption Info */}
          <Card variant="surface">
            <Flex direction="column" gap="2">
              <Text size="1" weight="bold">
                Encryption Details
              </Text>
              <Text size="1" color="gray">
                🔒 Encrypted with Seal protocol
              </Text>
              <Text size="1" color="gray">
                📦 Stored on Walrus (Blob ID: {article.walrus_blob_id.slice(0, 16)}...)
              </Text>
              <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>
                🔑 Key ID: {article.seal_key_id.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)}...
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Card>
    </Container>
  );
}
