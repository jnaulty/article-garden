/**
 * Main Sidebar Navigation Component
 * Collapsible left sidebar with publisher and reader sections
 */

import { useState, useEffect } from 'react';
import { Box, Flex, IconButton, Separator } from '@radix-ui/themes';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { PublisherNav } from '../Navigation/PublisherNav';
import { ReaderNav } from '../Navigation/ReaderNav';
import { usePublisherCaps } from '../../hooks/usePublisherCaps';

export function Sidebar() {
  const account = useCurrentAccount();
  const { data: caps } = usePublisherCaps();

  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const hasPublications = Boolean(caps && caps.length > 0);

  if (!account) {
    return null; // Don't show sidebar if not connected
  }

  return (
    <Box
      style={{
        width: isCollapsed ? '60px' : '240px',
        height: 'calc(100vh - 56px)', // Subtract header height
        position: 'sticky',
        top: '56px',
        backgroundColor: 'var(--gray-2)',
        borderRight: '1px solid var(--gray-a6)',
        transition: 'width 0.3s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 50,
      }}
    >
      <Flex direction="column" style={{ height: '100%' }}>
        {/* Toggle Button */}
        <Flex
          justify={isCollapsed ? 'center' : 'end'}
          px={isCollapsed ? '0' : '3'}
          py="3"
        >
          <IconButton
            variant="ghost"
            size="2"
            onClick={toggleSidebar}
            style={{ cursor: 'pointer' }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HamburgerMenuIcon width="18" height="18" />
          </IconButton>
        </Flex>

        <Separator size="4" mb="2" />

        {/* Publisher Section (if user has publications) */}
        {hasPublications && (
          <>
            <PublisherNav isCollapsed={isCollapsed} />
            <Separator size="4" my="3" />
          </>
        )}

        {/* Reader Section */}
        <ReaderNav isCollapsed={isCollapsed} hasPublications={hasPublications} />

        {/* Spacer to push content to top */}
        <Box style={{ flex: 1 }} />
      </Flex>
    </Box>
  );
}
