/**
 * Write Article Page
 * Allows publishers to create encrypted articles with Seal + Walrus
 */

import { useState } from 'react';
import { Container, Heading, Text, Button, Callout, Flex, Box, Card, Select, Spinner } from '@radix-ui/themes';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ArticleEditor } from '../components/Article/ArticleEditor';
import { useNavigate } from 'react-router-dom';
import { usePublisherPublications } from '../hooks/usePublisherCaps';
import { logger } from '../utils/logger';

export function WriteArticlePage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  // Fetch user's real publications from the blockchain
  const { data: publisherPublications, isLoading, error } = usePublisherPublications();

  const [selectedPublicationId, setSelectedPublicationId] = useState<string>('');
  const [publisherCapId, setPublisherCapId] = useState<string>('');
  const [statsId, setStatsId] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);

  if (!account) {
    return (
      <Container py="6">
        <Heading size="8" mb="4">
          Write Article
        </Heading>
        <Callout.Root color="amber">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Connect your wallet to publish articles</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container py="6">
        <Heading size="8" mb="4">
          Write Article
        </Heading>
        <Flex justify="center" align="center" py="9">
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container py="6">
        <Heading size="8" mb="4">
          Write Article
        </Heading>
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Error loading publications: {error.message}</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  const handlePublicationSelect = (publicationData: string) => {
    const [id, capId, statsId] = publicationData.split('|');
    setSelectedPublicationId(id);
    setPublisherCapId(capId);
    setStatsId(statsId || ''); // statsId may be undefined
    setShowEditor(true);
  };

  const handleSuccess = (result: any) => {
    logger.info({
      context: 'WriteArticlePage',
      operation: 'article_published',
      publicationId: selectedPublicationId,
      result
    }, 'Article published');
    // Navigate to the article or publication page
    setTimeout(() => {
      navigate('/publications');
    }, 2000);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setSelectedPublicationId('');
  };

  return (
    <Container size="4" py="6">
      <Box mb="6">
        <Heading size="8" mb="2">
          Publish New Article
        </Heading>
        <Text color="gray" size="3">
          Create encrypted content with Seal and store on Walrus
        </Text>
      </Box>

      {!showEditor ? (
        <Card size="4">
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" weight="bold" mb="2">
                Select Publication
              </Text>
              <Text size="1" color="gray" mb="3" as="div">
                Choose which publication to publish this article under
              </Text>

              {!publisherPublications || publisherPublications.length === 0 ? (
                <Callout.Root color="amber">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    You don't have any publications yet. Create one first!
                    <Box mt="2">
                      <Button size="2" onClick={() => navigate('/create-publication')}>
                        Create Publication
                      </Button>
                    </Box>
                  </Callout.Text>
                </Callout.Root>
              ) : (
                <Select.Root onValueChange={handlePublicationSelect}>
                  <Select.Trigger placeholder="Select a publication..." />
                  <Select.Content>
                    {publisherPublications.map((pubData) => (
                      <Select.Item
                        key={pubData.publication.id}
                        value={`${pubData.publication.id}|${pubData.capId}|${pubData.statsId || ''}`}
                      >
                        {pubData.publication.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Box>

            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                <Text size="2" weight="bold" as="div" mb="1">
                  How it works:
                </Text>
                <Text size="1" color="gray" as="div">
                  1. Your article content is encrypted with Seal protocol<br />
                  2. Encrypted data is stored on Walrus decentralized storage<br />
                  3. An on-chain article object is created with metadata<br />
                  4. Only subscribers with valid access can decrypt and read
                </Text>
              </Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      ) : (
        <ArticleEditor
          publicationId={selectedPublicationId}
          publisherCapId={publisherCapId}
          statsId={statsId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Container>
  );
}
