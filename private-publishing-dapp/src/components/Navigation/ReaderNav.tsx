/**
 * Reader Navigation Section
 * Shows reader-specific links (Browse, Subscriptions, Marketplace)
 */

import { Box, Text, Flex, Button } from '@radix-ui/themes';
import { MagnifyingGlassIcon, BookmarkIcon, Component1Icon, PlusIcon, InfoCircledIcon, ReaderIcon, GearIcon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import { NavLink } from './NavLink';

interface ReaderNavProps {
  isCollapsed: boolean;
  hasPublications: boolean;
}

export function ReaderNav({ isCollapsed, hasPublications }: ReaderNavProps) {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Section Header */}
      {!isCollapsed && (
        <Text
          size="1"
          weight="bold"
          style={{
            color: 'var(--gray-10)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '8px 16px',
            display: 'block',
          }}
        >
          Reader
        </Text>
      )}

      {/* Reader Actions */}
      <Flex direction="column" gap="1" px="2">
        <NavLink
          to="/feed"
          icon={<ReaderIcon width="18" height="18" />}
          label="My Feed"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/publications"
          icon={<MagnifyingGlassIcon width="18" height="18" />}
          label="Browse"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/my-subscriptions"
          icon={<BookmarkIcon width="18" height="18" />}
          label="Subscriptions"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/marketplace"
          icon={<Component1Icon width="18" height="18" />}
          label="Marketplace"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/settings"
          icon={<GearIcon width="18" height="18" />}
          label="Settings"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/backend-info"
          icon={<InfoCircledIcon width="18" height="18" />}
          label="Backend Info"
          isCollapsed={isCollapsed}
        />
      </Flex>

      {/* Become Publisher CTA (only if no publications) */}
      {!hasPublications && !isCollapsed && (
        <Box mt="4" px="3">
          <Button
            size="2"
            variant="soft"
            style={{ width: '100%', cursor: 'pointer' }}
            onClick={() => navigate('/create-publication')}
          >
            <PlusIcon width="16" height="16" />
            Become a Publisher
          </Button>
        </Box>
      )}
    </Box>
  );
}
