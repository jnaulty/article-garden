/**
 * ArticleEditor Component
 * Rich text editor for creating encrypted articles with Seal + Walrus
 */

import { useState } from 'react';
import {
  Container,
  Heading,
  Text,
  TextField,
  TextArea,
  Button,
  Select,
  Card,
  Flex,
  Box,
  Callout,
} from '@radix-ui/themes';
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { usePublishEncryptedArticle } from '../../hooks/useEncryptedArticle';
import { useSealSession } from '../../providers/SealSessionProvider';
import { usePublisherLayout, usePublisherPreferences } from '../../contexts/PublisherThemeContext';
import { Tier, TierString } from '../../types';
import { UI } from '../../config/constants';
import { logger } from '../../utils/logger';

export interface ArticleEditorProps {
  publicationId: string;
  publisherCapId: string;
  statsId: string;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

const TIER_OPTIONS: { value: TierString; label: string; description: string }[] = [
  {
    value: 'Free',
    label: 'Free Tier',
    description: 'Available to all subscribers with free access',
  },
  {
    value: 'Basic',
    label: 'Basic Tier',
    description: 'Requires Basic subscription or higher',
  },
  {
    value: 'Premium',
    label: 'Premium Tier',
    description: 'Requires Premium subscription',
  },
];

export function ArticleEditor({
  publicationId,
  publisherCapId,
  statsId,
  onSuccess,
  onCancel,
}: ArticleEditorProps) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierString>('Free');

  const { publishArticle, isPublishing, error, sessionReady } = usePublishEncryptedArticle();
  const { initializeSession, isInitializing } = useSealSession();

  // Publisher theme
  const layout = usePublisherLayout();
  const preferences = usePublisherPreferences();

  const [publishSuccess, setPublishSuccess] = useState(false);

  // Validation
  const isTitleValid = title.length >= UI.MIN_ARTICLE_TITLE_LENGTH && title.length <= UI.MAX_ARTICLE_TITLE_LENGTH;
  const isExcerptValid = excerpt.length <= UI.MAX_EXCERPT_LENGTH;
  const isContentValid = content.length > 0;
  const canSubmit = isTitleValid && isExcerptValid && isContentValid && !isPublishing && sessionReady;

  const handlePublish = async () => {
    if (!canSubmit) return;

    try {
      // Map string tier to enum
      const tierMap: Record<TierString, Tier> = {
        Free: Tier.Free,
        Basic: Tier.Basic,
        Premium: Tier.Premium,
      };

      const result = await publishArticle({
        publicationId,
        publisherCapId,
        statsId,
        title,
        excerpt,
        content,
        tier: tierMap[selectedTier],
      });

      setPublishSuccess(true);

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setTitle('');
        setExcerpt('');
        setContent('');
        setSelectedTier('Free');
        setPublishSuccess(false);
      }, 2000);
    } catch (err) {
      logger.error({
        context: 'ArticleEditor',
        operation: 'publish',
        error: err,
        publicationId,
        title
      }, 'Publish failed');
      // Error is handled by the hook
    }
  };

  const handleInitializeSession = async () => {
    try {
      await initializeSession();
    } catch (err) {
      logger.error({
        context: 'ArticleEditor',
        operation: 'initialize_session',
        error: err
      }, 'Session initialization failed');
    }
  };

  return (
    <Container size="3" py="6">
      <Card style={{ padding: `var(--space-${layout.cardPadding})` }}>
        <Flex direction="column" gap={layout.cardGap}>
          <Box>
            <Heading size="6" mb="2">
              Publish New Article
            </Heading>
            {preferences.showFormHelpers && (
              <Text color="gray" size="2">
                Your article will be encrypted with Seal and stored on Walrus
              </Text>
            )}
          </Box>

          {/* Seal Session Status */}
          {!sessionReady && (
            <Callout.Root color="blue">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Seal encryption requires a session key. Click below to initialize your session.
                <Box mt="2">
                  <Button
                    size="1"
                    onClick={handleInitializeSession}
                    disabled={isInitializing}
                  >
                    {isInitializing ? 'Initializing...' : 'Initialize Seal Session'}
                  </Button>
                </Box>
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Success Message */}
          {publishSuccess && (
            <Callout.Root color="green">
              <Callout.Icon>
                <CheckCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Article published successfully! Encrypted with Seal and uploaded to Walrus.
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Error Message */}
          {error && (
            <Callout.Root color="red">
              <Callout.Icon>
                <CrossCircledIcon />
              </Callout.Icon>
              <Callout.Text>{error.message}</Callout.Text>
            </Callout.Root>
          )}

          {/* Title Input */}
          <Box>
            <Text as="label" size="2" weight="bold" mb="1">
              Title *
            </Text>
            <TextField.Root
              placeholder="Enter article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="3"
            />
            {preferences.showAdvancedAnalytics && (
              <Text size="1" color="gray">
                {title.length} / {UI.MAX_ARTICLE_TITLE_LENGTH} characters
              </Text>
            )}
          </Box>

          {/* Excerpt Input */}
          <Box>
            <Text as="label" size="2" weight="bold" mb="1">
              Excerpt
            </Text>
            <TextArea
              placeholder="Brief summary or teaser (optional)..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              size="3"
            />
            {preferences.showAdvancedAnalytics && (
              <Text size="1" color="gray">
                {excerpt.length} / {UI.MAX_EXCERPT_LENGTH} characters
              </Text>
            )}
          </Box>

          {/* Tier Selection */}
          <Box>
            <Text as="label" size="2" weight="bold" mb="1">
              Access Tier *
            </Text>
            <Select.Root value={selectedTier} onValueChange={(value) => setSelectedTier(value as TierString)}>
              <Select.Trigger placeholder="Select tier..." />
              <Select.Content>
                {TIER_OPTIONS.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    <Flex direction="column" gap="1">
                      <Text weight="bold">{option.label}</Text>
                      <Text size="1" color="gray">
                        {option.description}
                      </Text>
                    </Flex>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Content Editor */}
          <Box>
            <Text as="label" size="2" weight="bold" mb="1">
              Content *
            </Text>
            <TextArea
              placeholder="Write your article content here... (will be encrypted with Seal)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              size="3"
            />
            {preferences.showAdvancedAnalytics && (
              <Text size="1" color="gray">
                {content.length} characters • Markdown supported
              </Text>
            )}
          </Box>

          {/* Action Buttons */}
          <Flex gap="3" justify="end">
            {onCancel && (
              <Button variant="soft" color="gray" onClick={onCancel} disabled={isPublishing}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handlePublish}
              disabled={!canSubmit}
              size="3"
            >
              {isPublishing ? (
                <>
                  <Box as="span" mr="2">⏳</Box>
                  Publishing...
                </>
              ) : (
                <>
                  <Box as="span" mr="2">🔒</Box>
                  Publish Encrypted Article
                </>
              )}
            </Button>
          </Flex>

          {/* Publishing Status */}
          {isPublishing && (
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                <Box mb="1">
                  <Text weight="bold">
                    Publishing in progress...
                  </Text>
                </Box>
                <Text size="1" color="gray" as="div">
                  1. Encrypting content with Seal<br />
                  2. Uploading to Walrus<br />
                  3. Creating on-chain article
                </Text>
              </Callout.Text>
            </Callout.Root>
          )}
        </Flex>
      </Card>
    </Container>
  );
}
