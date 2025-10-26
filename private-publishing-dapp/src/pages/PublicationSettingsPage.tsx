/**
 * Publication Settings Page (Placeholder)
 * Will be fully implemented in Phase 2
 */

import { Container, Heading, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useParams } from 'react-router-dom';
import { usePublication } from '../hooks/usePublicationQueries';

export function PublicationSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: publication } = usePublication(id);

  return (
    <Container size="3" py="6">
      <Heading size="8" mb="2">
        Publication Settings
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
          <Text weight="bold">Settings Page Coming Soon</Text>
          <br />
          Phase 2 will include: update pricing, toggle free tier, publication metadata editing,
          and marketplace royalty configuration.
        </Callout.Text>
      </Callout.Root>
    </Container>
  );
}
