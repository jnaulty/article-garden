/**
 * Reusable Navigation Link Component
 * Handles active states, icons, and collapsed mode
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flex, Text, Box } from '@radix-ui/themes';

interface NavLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
  isCollapsed?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export function NavLink({ to, icon, label, isCollapsed = false, badge, onClick }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        textDecoration: 'none',
        display: 'block',
      }}
    >
      <Flex
        align="center"
        gap="3"
        px={isCollapsed ? '2' : '3'}
        py="2"
        style={{
          height: '40px',
          borderRadius: 'var(--radius-2)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: isActive ? 'var(--accent-3)' : 'transparent',
          borderLeft: isActive ? '3px solid var(--accent-9)' : '3px solid transparent',
          position: 'relative',
        }}
        className="nav-link"
      >
        <Box
          style={{
            color: isActive ? 'var(--accent-11)' : 'var(--gray-11)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: isCollapsed ? '100%' : 'auto',
          }}
        >
          {icon}
        </Box>

        {!isCollapsed && (
          <>
            <Text
              size="2"
              weight="medium"
              style={{
                color: isActive ? 'var(--accent-11)' : 'var(--gray-12)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Text>

            {badge && (
              <Box
                px="2"
                style={{
                  backgroundColor: 'var(--gray-a4)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--gray-11)',
                  flexShrink: 0,
                }}
              >
                {badge}
              </Box>
            )}
          </>
        )}
      </Flex>

      <style>{`
        .nav-link:hover {
          background-color: var(--gray-a3);
        }
      `}</style>
    </Link>
  );
}
