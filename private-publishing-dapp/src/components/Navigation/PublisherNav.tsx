/**
 * Publisher Navigation Section
 * Shows publisher-specific links and publication list
 */

import { Box, Text, Flex, Spinner } from '@radix-ui/themes';
import { DashboardIcon, Pencil2Icon, PlusIcon, FileTextIcon } from '@radix-ui/react-icons';
import { NavLink } from './NavLink';
import { PublicationNavItem } from './PublicationNavItem';
import { usePublisherPublications } from '../../hooks/usePublisherCaps';

interface PublisherNavProps {
  isCollapsed: boolean;
}

export function PublisherNav({ isCollapsed }: PublisherNavProps) {
  const { data: publications, isLoading } = usePublisherPublications();

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
          Publisher
        </Text>
      )}

      {/* Publisher Actions */}
      <Flex direction="column" gap="1" px="2">
        <NavLink
          to="/dashboard"
          icon={<DashboardIcon width="18" height="18" />}
          label="Dashboard"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/dashboard/write"
          icon={<Pencil2Icon width="18" height="18" />}
          label="Write Article"
          isCollapsed={isCollapsed}
        />

        <NavLink
          to="/create-publication"
          icon={<PlusIcon width="18" height="18" />}
          label="New Publication"
          isCollapsed={isCollapsed}
        />
      </Flex>

      {/* Publications List */}
      {!isCollapsed && publications && publications.length > 0 && (
        <Box mt="4">
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
            My Publications
          </Text>

          <Flex direction="column" gap="1" px="2">
            {isLoading ? (
              <Flex justify="center" py="4">
                <Spinner size="2" />
              </Flex>
            ) : (
              publications.map((pub) => (
                <PublicationNavItem
                  key={pub.publication.id}
                  publication={pub.publication}
                  isCollapsed={isCollapsed}
                />
              ))
            )}
          </Flex>
        </Box>
      )}

      {/* Collapsed mode - show publication icons */}
      {isCollapsed && publications && publications.length > 0 && (
        <Box mt="2">
          <Flex direction="column" gap="1" px="2">
            {publications.slice(0, 5).map((pub) => (
              <NavLink
                key={pub.publication.id}
                to={`/dashboard/publications/${pub.publication.id}`}
                icon={<FileTextIcon width="18" height="18" />}
                label={pub.publication.name}
                isCollapsed={true}
              />
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}
