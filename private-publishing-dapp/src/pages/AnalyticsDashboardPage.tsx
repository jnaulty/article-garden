/**
 * Analytics Dashboard Page (Placeholder)
 * Will be fully implemented in Phase 3
 */

import { Container, Heading, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useParams } from 'react-router-dom';
import { usePublication } from '../hooks/usePublicationQueries';

export function AnalyticsDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: publication } = usePublication(id);

  return (
    <Container size="3" py="6">
      <Heading size="8" mb="2">
        Analytics
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
          <Text weight="bold">Analytics Dashboard Coming Soon</Text>
          <br />
          Phase 3 will include: revenue charts, subscriber breakdowns, article performance metrics,
          and growth analytics.
        </Callout.Text>
      </Callout.Root>
    </Container>
  );
}
