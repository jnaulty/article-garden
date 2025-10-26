/**
 * Individual Publication Navigation Item
 * Displays publication with article count and navigates to publication page
 */

import { FileTextIcon } from '@radix-ui/react-icons';
import { NavLink } from './NavLink';
import type { Publication } from '../../types';

interface PublicationNavItemProps {
  publication: Publication;
  isCollapsed: boolean;
}

export function PublicationNavItem({ publication, isCollapsed }: PublicationNavItemProps) {
  const articleCount = publication.article_count || '0';

  return (
    <NavLink
      to={`/dashboard/publications/${publication.id}`}
      icon={<FileTextIcon width="18" height="18" />}
      label={publication.name}
      badge={isCollapsed ? undefined : articleCount}
      isCollapsed={isCollapsed}
    />
  );
}
