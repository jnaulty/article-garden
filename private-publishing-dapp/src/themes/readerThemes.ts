/**
 * Reader Theme Configurations
 *
 * Theme definitions for different reader personas:
 * - Casual Reader: Minimalist, discovery-focused (Variation 1)
 * - Dedicated Subscriber: Balanced, content-focused (Variation 2)
 * - Default: Standard Radix UI styling
 */

import { ReaderThemeConfig, ReaderPersona } from '../types/persona';

/**
 * Casual Reader Theme (Variation 1)
 *
 * Design Philosophy:
 * - Spacious, uncluttered layouts
 * - Large imagery and hero sections
 * - Free content prominently featured
 * - Gentle onboarding for Web3 concepts
 * - Single-column layouts for easy scanning
 * - Mobile-first responsive design
 */
export const casualReaderTheme: ReaderThemeConfig = {
  name: 'casual',
  displayName: 'Casual Reader',
  description: 'Clean, spacious design perfect for discovering new content',

  layout: {
    density: 'spacious',
    cardPadding: '6', // 32px - generous spacing
    cardGap: '5', // 24px
    containerSize: '3', // 880px - wide but not full-width
  },

  typography: {
    headingSize: '8', // Larger, more prominent
    bodySize: '3', // 16px - comfortable reading
    emphasisWeight: 'regular', // Lighter feel
    lineHeight: 'loose', // More breathing room
  },

  features: {
    showReadingProgress: false, // Simplified experience
    showContinueReading: false, // No reading state tracking
    showArticleMetadata: true, // Show basics (read time, date)
    showPublicationBranding: true, // Emphasize publication identity
    emphasizeImagery: true, // Large cover images
  },

  navigation: {
    style: 'minimal', // Clean top nav only
    feedFirst: false, // Browse-first experience
    browseFirst: true, // Discovery is primary
  },
};

/**
 * Dedicated Subscriber Theme (Variation 2)
 *
 * Design Philosophy:
 * - Dashboard-style navigation like Substack
 * - Personalized feed aggregating multiple subscriptions
 * - Reading progress tracking
 * - Content-first experience with sidebar navigation
 * - Subscription management tools
 * - Reading statistics and analytics
 */
export const dedicatedSubscriberTheme: ReaderThemeConfig = {
  name: 'dedicated',
  displayName: 'Dedicated Subscriber',
  description: 'Feed-focused experience with reading progress and personalized content',

  layout: {
    density: 'balanced',
    cardPadding: '4', // 16px - efficient use of space
    cardGap: '4', // 16px
    containerSize: '3', // 880px - optimal reading width
  },

  typography: {
    headingSize: '6', // Balanced, not overwhelming
    bodySize: '3', // 16px - readable
    emphasisWeight: 'medium', // Moderate emphasis
    lineHeight: 'relaxed', // Good for sustained reading
  },

  features: {
    showReadingProgress: true, // Track what you've read
    showContinueReading: true, // Resume reading section
    showArticleMetadata: true, // Full metadata (progress %, time remaining)
    showPublicationBranding: true, // Multi-publication context
    emphasizeImagery: false, // Content over images
  },

  navigation: {
    style: 'standard', // Sidebar + top nav
    feedFirst: true, // Feed is primary view
    browseFirst: false, // Already subscribed, focus on reading
  },
};

/**
 * Default Theme
 *
 * Standard Radix UI styling, balanced approach
 */
export const defaultReaderTheme: ReaderThemeConfig = {
  name: 'default',
  displayName: 'Default',
  description: 'Standard reading experience',

  layout: {
    density: 'balanced',
    cardPadding: '4', // 16px
    cardGap: '4', // 16px
    containerSize: '3', // 880px
  },

  typography: {
    headingSize: '7', // Medium-large
    bodySize: '3', // 16px
    emphasisWeight: 'medium',
    lineHeight: 'normal',
  },

  features: {
    showReadingProgress: true,
    showContinueReading: true,
    showArticleMetadata: true,
    showPublicationBranding: true,
    emphasizeImagery: false,
  },

  navigation: {
    style: 'standard',
    feedFirst: false,
    browseFirst: false,
  },
};

/**
 * Theme Registry
 *
 * Maps persona types to theme configurations
 */
export const readerThemes: Record<ReaderPersona, ReaderThemeConfig> = {
  casual: casualReaderTheme,
  dedicated: dedicatedSubscriberTheme,
  default: defaultReaderTheme,
};

/**
 * Get theme by persona
 */
export function getReaderTheme(persona: ReaderPersona): ReaderThemeConfig {
  return readerThemes[persona] || defaultReaderTheme;
}
