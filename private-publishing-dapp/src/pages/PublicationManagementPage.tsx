/**
 * Publication Management Page (Placeholder)
 * Will be fully implemented in Phase 2
 */

import { Container, Heading, Text, Card, Flex, Box, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useParams } from 'react-router-dom';
import { usePublication } from '../hooks/usePublicationQueries';

export function PublicationManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { data: publication, isLoading } = usePublication(id);

  if (isLoading) {
    return (
      <Container py="6">
        <Text>Loading publication...</Text>
      </Container>
    );
  }

  if (!publication) {
    return (
      <Container py="6">
        <Heading size="8" mb="4">
          Publication Not Found
        </Heading>
        <Text color="gray">The requested publication could not be found.</Text>
      </Container>
    );
  }

  return (
    <Container size="3" py="6">
      <Box mb="6">
        <Heading size="8" mb="2">
          {publication.name}
        </Heading>
        <Text color="gray" size="3">
          {publication.description}
        </Text>
      </Box>

      <Callout.Root color="blue" mb="4">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          <Text weight="bold">Publication Management Page</Text>
          <br />
          Full management features coming in Phase 2. This will include:
          article management, pricing updates, analytics overview, and settings.
        </Callout.Text>
      </Callout.Root>

      <Card>
        <Flex direction="column" gap="4">
          <Box>
            <Text size="2" weight="bold" color="gray">
              Quick Stats
            </Text>
          </Box>

          <Flex gap="6">
            <Box>
              <Text size="1" color="gray">
                Articles
              </Text>
              <Text size="6" weight="bold">
                {publication.article_count}
              </Text>
            </Box>

            <Box>
              <Text size="1" color="gray">
                Basic Price
              </Text>
              <Text size="6" weight="bold">
                {(BigInt(publication.basic_price) / BigInt(1_000_000_000)).toString()} SUI
              </Text>
            </Box>

            <Box>
              <Text size="1" color="gray">
                Premium Price
              </Text>
              <Text size="6" weight="bold">
                {(BigInt(publication.premium_price) / BigInt(1_000_000_000)).toString()} SUI
              </Text>
            </Box>

            <Box>
              <Text size="1" color="gray">
                Free Tier
              </Text>
              <Text size="6" weight="bold">
                {publication.free_tier_enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Card>
    </Container>
  );
}
