/**
 * ArticleFeedItem Component
 * Displays an article in the feed with publication context and reading progress
 */

import { Card, Flex, Heading, Text, Badge, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import type { FeedArticle } from '../../types';

export interface ArticleFeedItemProps {
  article: FeedArticle;
}

export function ArticleFeedItem({ article }: ArticleFeedItemProps) {
  const publishedDate = new Date(Number(article.published_at) * 1000);
  const isNew = !article.is_read;
  const hasProgress = article.read_progress && article.read_progress > 0;

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const timeAgo = formatTimeAgo(publishedDate);

  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* Publication Header */}
        <Flex justify="between" align="center">
          <Text size="2" weight="medium" color="gray">
            {article.publication_name}
          </Text>
          <Text size="1" color="gray">{timeAgo}</Text>
        </Flex>

        {/* Article Content */}
        <Link
          to={`/publications/${article.publication_id}/articles/${article.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Card variant="surface" style={{ cursor: 'pointer' }}>
            <Flex direction="column" gap="2">
              {/* Title Row */}
              <Flex justify="between" align="start" gap="3">
                <Heading size="4" style={{ flex: 1 }}>
                  {article.title}
                </Heading>
                {isNew && (
                  <Badge color="blue" size="1">NEW</Badge>
                )}
              </Flex>

              {/* Excerpt */}
              {article.excerpt && (
                <Text
                  size="2"
                  color="gray"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.excerpt}
                </Text>
              )}

              {/* Metadata Row */}
              <Flex justify="between" align="center" mt="2">
                <Text size="1" color="gray">
                  {article.estimated_read_time || 5} min read
                </Text>

                {/* Progress Bar */}
                {hasProgress && (
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
            </Flex>
          </Card>
        </Link>
      </Flex>
    </Card>
  );
}
