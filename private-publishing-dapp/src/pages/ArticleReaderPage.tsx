/**
 * Article Reader Page
 * Displays encrypted articles with decrypt capability and access gates
 */

import { Container, Callout, Spinner, Flex, Heading, Card, Separator } from '@radix-ui/themes';
import { useParams } from 'react-router-dom';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useArticleAccess } from '../hooks/useAccessQueries';
import { fetchArticleById, fetchPublicationById } from '../utils/graphqlQueries';
import { ArticleAccessGate } from '../components/Article/ArticleAccessGate';
import { ArticleReader } from '../components/Article/ArticleReader';

export function ArticleReaderPage() {
  const { articleId } = useParams();

  // Fetch article data
  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => fetchArticleById(articleId!),
    enabled: !!articleId,
  });

  // Fetch publication data (needed for access gate)
  const { data: publication, isLoading: publicationLoading } = useQuery({
    queryKey: ['publication', article?.publication_id],
    queryFn: () => fetchPublicationById(article!.publication_id),
    enabled: !!article?.publication_id,
  });

  // Check user's access to this article
  const { data: accessData, isLoading: accessLoading } = useArticleAccess(articleId);

  const isLoading = articleLoading || publicationLoading || accessLoading;
  const hasAccess = accessData?.hasAccess || false;

  // No article ID provided
  if (!articleId) {
    return (
      <Container py="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Article ID not provided</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Container py="6">
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  // Error state
  if (articleError || !article) {
    return (
      <Container py="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            {articleError?.message || 'Article not found'}
          </Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  // Publication not found
  if (!publication) {
    return (
      <Container py="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Publication not found</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Article Header */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="8">{article.title}</Heading>
            <Separator size="4" />
          </Flex>
        </Card>

        {/* Access Gate or Article Reader */}
        {hasAccess ? (
          <ArticleReader
            article={article}
            subscriptionId={accessData?.objectId}
            readTokenId={accessData?.method === 'token' ? accessData.objectId : undefined}
            onSubscribe={() => {}}
            onPurchaseToken={() => {}}
          />
        ) : (
          <ArticleAccessGate
            article={article}
            publication={publication}
            hasAccess={hasAccess}
            accessMethod={accessData?.method}
            onAccessGranted={() => {
              // Reload to refresh access status
              window.location.reload();
            }}
          />
        )}
      </Flex>
    </Container>
  );
}
