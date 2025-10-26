/**
 * ContinueReadingCard Component
 * Displays an in-progress article with progress bar
 */

import { Card, Flex, Heading, Text, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import type { FeedArticle } from '../../types';

export interface ContinueReadingCardProps {
  article: FeedArticle;
}

export function ContinueReadingCard({
  article
}: ContinueReadingCardProps) {
  const readingProgress = article.read_progress || 0;
  const estimatedTotalTime = article.estimated_read_time || 5;
  const timeRemaining = Math.ceil(
    estimatedTotalTime * ((100 - readingProgress) / 100)
  );

  return (
    <Link
      to={`/publications/${article.publication_id}/articles/${article.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card style={{ cursor: 'pointer', height: '100%' }}>
        <Flex direction="column" gap="3" style={{ height: '100%' }}>
          {/* Publication Name */}
          <Text size="2" weight="medium" color="gray">
            {article.publication_name}
          </Text>

          {/* Article Title */}
          <Heading size="4" style={{ flex: 1 }}>
            {article.title}
          </Heading>

          {/* Progress Section */}
          <Box>
            {/* Progress Bar */}
            <Flex align="center" gap="2" mb="2">
              <Box
                style={{
                  flex: 1,
                  height: '8px',
                  background: 'var(--gray-a5)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: `${readingProgress}%`,
                    height: '100%',
                    background: 'var(--accent-9)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Text size="1" color="gray" style={{ minWidth: '35px' }}>
                {readingProgress}%
              </Text>
            </Flex>

            {/* Time Remaining */}
            <Text size="1" color="gray">
              {timeRemaining} min remaining
            </Text>
          </Box>
        </Flex>
      </Card>
    </Link>
  );
}
