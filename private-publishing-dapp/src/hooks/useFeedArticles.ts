/**
 * Hook for fetching and managing personalized article feed
 * Aggregates articles from user's subscriptions
 */

import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useUserSubscriptionsWithPublications } from './useSubscriptionQueries';
import { useNetworkVariable } from '../networkConfig';
import { fetchArticlesByPublicationId } from '../utils/graphqlQueries';
import type { FeedArticle } from '../types';
import {
  getReadingProgress,
  isArticleRead,
  getLastReadTime,
  estimateReadTime,
} from '../utils/readingProgress';

export interface UseFeedArticlesOptions {
  publicationId?: string; // Filter by publication ('all' or specific ID)
  sortBy?: 'newest' | 'oldest' | 'unread';
  unreadOnly?: boolean;
}

export interface UseFeedArticlesReturn {
  data: FeedArticle[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch all articles from user's subscribed publications
 */
export function useFeedArticles(
  options: UseFeedArticlesOptions = {}
): UseFeedArticlesReturn {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable('packageId');
  const { data: subscriptions, isLoading: subsLoading } = useUserSubscriptionsWithPublications();

  const query = useQuery({
    queryKey: ['feed-articles', account?.address, subscriptions, options],
    queryFn: async (): Promise<FeedArticle[]> => {
      if (!account || !subscriptions || subscriptions.length === 0) {
        return [];
      }

      // 1. Get all publication IDs from subscriptions
      const publicationIds = subscriptions
        .filter(sub => sub.publication)
        .map(sub => sub.publication_id);

      if (publicationIds.length === 0) {
        return [];
      }

      // 2. Fetch articles for each publication
      const articlesPromises = publicationIds.map(pubId =>
        fetchArticlesByPublicationId(packageId, pubId)
      );

      const articlesArrays = await Promise.all(articlesPromises);

      // 3. Flatten and enrich with publication + reading data
      const allArticles: FeedArticle[] = articlesArrays
        .flat()
        .map(article => {
          const subscription = subscriptions.find(
            s => s.publication_id === article.publication_id
          );

          // Estimate read time based on content (rough estimate)
          // TODO: Could be improved by fetching actual content length
          const estimatedReadTime = estimateReadTime(
            (article.excerpt?.length || 0) * 10 // Rough multiplier
          );

          return {
            ...article,
            publication_name: subscription?.publication?.name || 'Unknown',
            publication_id: article.publication_id,
            publication_image_url: undefined, // TODO: Add if publications have images
            read_progress: getReadingProgress(article.id),
            is_read: isArticleRead(article.id),
            last_read_at: getLastReadTime(article.id),
            estimated_read_time: estimatedReadTime,
          } as FeedArticle;
        });

      // 4. Apply filters
      let filtered = allArticles;

      if (options.publicationId && options.publicationId !== 'all') {
        filtered = filtered.filter(
          a => a.publication_id === options.publicationId
        );
      }

      if (options.unreadOnly) {
        filtered = filtered.filter(a => !a.is_read);
      }

      // 5. Sort
      filtered.sort((a, b) => {
        switch (options.sortBy) {
          case 'oldest':
            return Number(a.published_at) - Number(b.published_at);
          case 'unread':
            // Unread first, then by date
            if (a.is_read === b.is_read) {
              return Number(b.published_at) - Number(a.published_at);
            }
            return a.is_read ? 1 : -1;
          case 'newest':
          default:
            return Number(b.published_at) - Number(a.published_at);
        }
      });

      return filtered;
    },
    enabled: !!account && !!subscriptions && !subsLoading && packageId !== '0x0',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: query.data,
    isLoading: query.isLoading || subsLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get articles that are currently in progress (1-89% read)
 */
export function useInProgressArticles(limit: number = 3) {
  const { data: feedArticles, isLoading, error } = useFeedArticles();

  const inProgressArticles = feedArticles
    ?.filter(a =>
      a.read_progress &&
      a.read_progress > 0 &&
      a.read_progress < 90
    )
    ?.sort((a, b) => (b.last_read_at || 0) - (a.last_read_at || 0))
    ?.slice(0, limit);

  return {
    data: inProgressArticles || [],
    isLoading,
    error,
  };
}
