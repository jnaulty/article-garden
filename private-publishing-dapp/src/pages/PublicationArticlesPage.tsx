/**
 * Publication Articles Management Page (Placeholder)
 * Will be fully implemented in Phase 4
 */

import { Container, Heading, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useParams } from 'react-router-dom';
import { usePublication } from '../hooks/usePublicationQueries';

export function PublicationArticlesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: publication } = usePublication(id);

  return (
    <Container size="3" py="6">
      <Heading size="8" mb="2">
        Article Management
      </Heading>
      {publication && (
        <Text color="gray" size="3" mb="6">
          {publication.name}
        </Text>
      )}

      <Callout.Root color="blue">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          <Text weight="bold">Article Management Coming Soon</Text>
          <br />
          Phase 4 will include: article list, edit article metadata, archive/unarchive,
          and bulk operations.
        </Callout.Text>
      </Callout.Root>
    </Container>
  );
}
