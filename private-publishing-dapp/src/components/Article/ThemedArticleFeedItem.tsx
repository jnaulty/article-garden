/**
 * Themed Article Feed Item
 *
 * Example component showing how to apply reader persona theming to article feed items.
 * Shows/hides reading progress and metadata based on persona preferences.
 *
 * This is a reference implementation for the personalized feed experience.
 */

import { Card, Flex, Heading, Text, Badge, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useReaderFeatures, useReaderLayout, useReaderTypography } from '../../contexts/ReaderThemeContext';
import { Article } from '../../types';

interface ThemedArticleFeedItemProps {
  article: Article & {
    publication_name: string;
    publication_id: string;
    read_progress?: number; // 0-100
    is_read?: boolean;
  };
}

export function ThemedArticleFeedItem({ article }: ThemedArticleFeedItemProps) {
  const features = useReaderFeatures();
  const layout = useReaderLayout();
  const typography = useReaderTypography();

  const timeAgo = formatDistanceToNow(new Date(Number(article.published_at) * 1000), {
    addSuffix: true,
  });

  const hasProgress = article.read_progress && article.read_progress > 0;
  const isNew = !article.is_read;

  // Tier colors
  const tierColorMap: Record<number, 'gray' | 'blue' | 'purple'> = {
    0: 'gray', // Free
    1: 'blue', // Basic
    2: 'purple', // Premium
  };

  return (
    <Card style={{ padding: `var(--space-${layout.cardPadding})` }}>
      <Flex direction="column" gap="3">
        {/* Publication Header - show if branding enabled */}
        {features.showPublicationBranding && (
          <Flex justify="between" align="center">
            <Text size="2" weight="medium" color="gray">
              {article.publication_name}
            </Text>
            {features.showArticleMetadata && (
              <Text size="1" color="gray">
                {timeAgo}
              </Text>
            )}
          </Flex>
        )}

        {/* Article Content */}
        <Link
          to={`/publications/${article.publication_id}/articles/${article.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Card variant="surface" style={{ cursor: 'pointer' }}>
            <Flex direction="column" gap="2">
              {/* Title Row */}
              <Flex justify="between" align="start" gap="3">
                <Heading
                  size={typography.headingSize}
                  weight={typography.emphasisWeight}
                  style={{ flex: 1, lineHeight: '1.3' }}
                >
                  {article.title}
                </Heading>
                {isNew && (
                  <Badge color="blue" size="1">
                    NEW
                  </Badge>
                )}
              </Flex>

              {/* Excerpt - only show for casual readers (emphasis on discovery) */}
              {article.excerpt && features.emphasizeImagery && (
                <Text
                  size={typography.bodySize}
                  color="gray"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.6',
                  }}
                >
                  {article.excerpt}
                </Text>
              )}

              {/* Metadata Row */}
              {features.showArticleMetadata && (
                <Flex justify="between" align="center" mt="2">
                  <Flex align="center" gap="2">
                    {/* Read Time */}
                    <Text size="1" color="gray">
                      {article.estimated_read_time || 5} min read
                    </Text>

                    {/* Tier Badge */}
                    <Badge color={tierColorMap[article.tier]} variant="soft" size="1">
                      {article.tier === 0 ? 'Free' : article.tier === 1 ? 'Basic' : 'Premium'}
                    </Badge>
                  </Flex>

                  {/* Reading Progress - show if enabled */}
                  {features.showReadingProgress && hasProgress && (
                    <Flex align="center" gap="2">
                      <Box
                        style={{
                          width: '100px',
                          height: '4px',
                          background: 'var(--gray-a5)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          style={{
                            width: `${article.read_progress}%`,
                            height: '100%',
                            background: 'var(--accent-9)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <Text size="1" color="gray">
                        {article.read_progress}%
                      </Text>
                    </Flex>
                  )}
                </Flex>
              )}
            </Flex>
          </Card>
        </Link>
      </Flex>
    </Card>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * // In FeedPage.tsx or similar
 * import { ThemedArticleFeedItem } from './components/Article/ThemedArticleFeedItem';
 *
 * function FeedPage() {
 *   const { data: articles } = useFeedArticles();
 *
 *   return (
 *     <Container>
 *       <Flex direction="column" gap="3">
 *         {articles?.map((article) => (
 *           <ThemedArticleFeedItem key={article.id} article={article} />
 *         ))}
 *       </Flex>
 *     </Container>
 *   );
 * }
 * ```
 *
 * Behavior by Persona:
 * - Casual Reader: Shows excerpt, hides progress, emphasizes discovery
 * - Dedicated Subscriber: Shows progress, compact layout, feed-focused
 * - Default: Shows all features, balanced layout
 */
