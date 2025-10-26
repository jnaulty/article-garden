/**
 * Themed Publication Card
 *
 * Example component showing how to apply reader persona theming.
 * Adapts layout, typography, and feature visibility based on user's persona.
 *
 * This is a reference implementation - you can apply the same patterns to existing PublicationCard.
 */

import { Card, Flex, Heading, Text, Badge, Box } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { useReaderFeatures, useReaderLayout, useReaderTypography } from '../../contexts/ReaderThemeContext';
import { Publication } from '../../types';

interface ThemedPublicationCardProps {
  publication: Publication;
}

export function ThemedPublicationCard({ publication }: ThemedPublicationCardProps) {
  const features = useReaderFeatures();
  const layout = useReaderLayout();
  const typography = useReaderTypography();

  // Calculate line height multiplier
  const lineHeightMap = {
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  };
  const lineHeight = lineHeightMap[typography.lineHeight];

  return (
    <Link
      to={`/publications/${publication.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card
        style={{
          cursor: 'pointer',
          height: '100%',
          transition: 'all 0.2s ease',
          padding: `var(--space-${layout.cardPadding})`,
        }}
      >
        <Flex direction="column" gap="3" style={{ height: '100%' }}>
          {/* Publication Image - only show if theme emphasizes imagery */}
          {features.emphasizeImagery && publication.image_url && (
            <Box
              style={{
                width: '100%',
                height: layout.density === 'spacious' ? '240px' : '180px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--gray-a3)',
              }}
            >
              <img
                src={publication.image_url}
                alt={publication.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
          )}

          {/* Publication Branding - show if enabled */}
          {features.showPublicationBranding && (
            <Flex align="center" gap="2">
              {publication.image_url && !features.emphasizeImagery && (
                <Box
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: 'var(--gray-a3)',
                  }}
                >
                  <img
                    src={publication.image_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}
              <Flex direction="column">
                <Heading
                  size={typography.headingSize}
                  weight={typography.emphasisWeight}
                  style={{ lineHeight: '1.2' }}
                >
                  {publication.name}
                </Heading>
              </Flex>
            </Flex>
          )}

          {/* Description */}
          <Text
            size={typography.bodySize}
            color="gray"
            style={{
              lineHeight,
              display: '-webkit-box',
              WebkitLineClamp: layout.density === 'spacious' ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {publication.description}
          </Text>

          {/* Metadata - show if enabled */}
          {features.showArticleMetadata && (
            <Flex gap="3" wrap="wrap" mt="auto">
              {/* Article Count */}
              <Badge color="gray" variant="soft" size="1">
                {publication.article_count || 0} articles
              </Badge>

              {/* Subscriber Count (if available) */}
              {publication.subscriber_count !== undefined && (
                <Badge color="blue" variant="soft" size="1">
                  {publication.subscriber_count} subscribers
                </Badge>
              )}

              {/* Pricing Tiers */}
              {publication.basic_price && (
                <Badge color="blue" variant="soft" size="1">
                  From {publication.basic_price} SUI/mo
                </Badge>
              )}
            </Flex>
          )}
        </Flex>
      </Card>
    </Link>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * // In your PublicationBrowsePage.tsx or similar
 * import { ThemedPublicationCard } from './components/Publication/ThemedPublicationCard';
 *
 * function PublicationBrowsePage() {
 *   const { data: publications } = usePublications();
 *
 *   return (
 *     <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
 *       {publications?.map((pub) => (
 *         <ThemedPublicationCard key={pub.id} publication={pub} />
 *       ))}
 *     </Grid>
 *   );
 * }
 * ```
 *
 * Behavior by Persona:
 * - Casual Reader: Large image, spacious layout, emphasis on discovery
 * - Dedicated Subscriber: Compact layout, metadata-rich, content-focused
 * - Default: Balanced approach
 */
