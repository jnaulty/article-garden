/**
 * FeedPage Component
 * Personalized feed aggregating articles from all user subscriptions
 * Substack-like reading experience
 */

import { Container, Heading, Flex, Text, Select, Switch, Spinner, Callout, Box } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useFeedArticles } from '../hooks/useFeedArticles';
import { useUserSubscriptionsWithPublications } from '../hooks/useSubscriptionQueries';
import { ThemedArticleFeedItem } from '../components/Article/ThemedArticleFeedItem';

interface FeedFilters {
  publicationFilter: string;  // 'all' | publication_id
  sortBy: 'newest' | 'oldest' | 'unread';
  showUnreadOnly: boolean;
}

export function FeedPage() {
  const account = useCurrentAccount();
  const [filters, setFilters] = useState<FeedFilters>({
    publicationFilter: 'all',
    sortBy: 'newest',
    showUnreadOnly: false,
  });

  const { data: subscriptions } = useUserSubscriptionsWithPublications();
  const { data: articles, isLoading, error } = useFeedArticles({
    publicationId: filters.publicationFilter,
    sortBy: filters.sortBy,
    unreadOnly: filters.showUnreadOnly,
  });

  // Not logged in
  if (!account) {
    return (
      <Container size="3" py="6">
        <Callout.Root color="amber">
          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
          <Callout.Text>Connect your wallet to see your personalized feed</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="4">
        {/* Header */}
        <Box>
          <Heading size="8">My Feed</Heading>
          <Text color="gray" size="3">
            Articles from your subscriptions
          </Text>
        </Box>

        {/* Filters */}
        <Flex gap="3" wrap="wrap" align="center">
          {/* Publication Filter */}
          <Select.Root
            value={filters.publicationFilter}
            onValueChange={(value) => setFilters({ ...filters, publicationFilter: value })}
          >
            <Select.Trigger placeholder="All Publications" style={{ minWidth: '200px' }} />
            <Select.Content>
              <Select.Item value="all">All Publications</Select.Item>
              {subscriptions?.map(sub => sub.publication && (
                <Select.Item key={sub.publication_id} value={sub.publication_id}>
                  {sub.publication.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {/* Sort Filter */}
          <Select.Root
            value={filters.sortBy}
            onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
          >
            <Select.Trigger placeholder="Sort by" style={{ minWidth: '150px' }} />
            <Select.Content>
              <Select.Item value="newest">Newest First</Select.Item>
              <Select.Item value="oldest">Oldest First</Select.Item>
              <Select.Item value="unread">Unread First</Select.Item>
            </Select.Content>
          </Select.Root>

          {/* Unread Only Toggle */}
          <Flex align="center" gap="2">
            <Switch
              checked={filters.showUnreadOnly}
              onCheckedChange={(checked) => setFilters({ ...filters, showUnreadOnly: checked })}
            />
            <Text size="2">Unread only</Text>
          </Flex>
        </Flex>

        {/* Loading State */}
        {isLoading && (
          <Flex justify="center" py="9">
            <Spinner size="3" />
          </Flex>
        )}

        {/* Error State */}
        {error && (
          <Callout.Root color="red">
            <Callout.Icon><InfoCircledIcon /></Callout.Icon>
            <Callout.Text>Error loading feed: {error.message}</Callout.Text>
          </Callout.Root>
        )}

        {/* Empty State */}
        {!isLoading && !error && articles && articles.length === 0 && (
          <Callout.Root>
            <Callout.Icon><InfoCircledIcon /></Callout.Icon>
            <Callout.Text>
              {filters.showUnreadOnly || filters.publicationFilter !== 'all'
                ? 'No articles match your filters. Try adjusting them.'
                : 'No articles yet. Subscribe to publications to see content here!'}
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Feed Items */}
        {!isLoading && !error && articles && articles.length > 0 && (
          <Flex direction="column" gap="3">
            {articles.map((article) => (
              <ThemedArticleFeedItem key={article.id} article={article} />
            ))}
          </Flex>
        )}
      </Flex>
    </Container>
  );
}
