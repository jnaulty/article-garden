/**
 * Settings Page
 *
 * User preferences and configuration settings.
 * Currently includes reader persona selection.
 */

import { Container, Flex, Heading, Box, Separator } from '@radix-ui/themes';
import { ReaderPersonaSettings } from '../components/Settings/ReaderPersonaSettings';
import { PublisherPersonaSettings } from '../components/Settings/PublisherPersonaSettings';

export function SettingsPage() {
  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        {/* Page Header */}
        <Box>
          <Heading size="8">Settings</Heading>
        </Box>

        <Separator size="4" />

        {/* Reader Persona Settings */}
        <ReaderPersonaSettings />

        <Separator size="4" />

        {/* Publisher Persona Settings */}
        <PublisherPersonaSettings />

        {/* Future settings sections can be added here */}
        {/* <Separator size="4" /> */}
        {/* <NotificationSettings /> */}
        {/* <PrivacySettings /> */}
        {/* <AccountSettings /> */}
      </Flex>
    </Container>
  );
}
