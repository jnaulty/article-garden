/**
 * ContinueReadingSection Component
 * Displays a section of articles that are currently in progress
 */

import { Box, Heading, Grid } from '@radix-ui/themes';
import { useInProgressArticles } from '../../hooks/useFeedArticles';
import { ContinueReadingCard } from './ContinueReadingCard';

export interface ContinueReadingSectionProps {
  limit?: number;
}

export function ContinueReadingSection({
  limit = 3
}: ContinueReadingSectionProps) {
  const { data: inProgressArticles, isLoading } = useInProgressArticles(limit);

  // Don't render if no articles in progress or still loading
  if (isLoading || !inProgressArticles || inProgressArticles.length === 0) {
    return null;
  }

  return (
    <Box>
      <Heading size="5" mb="4">Continue Reading</Heading>
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        {inProgressArticles.map(article => (
          <ContinueReadingCard key={article.id} article={article} />
        ))}
      </Grid>
    </Box>
  );
}
