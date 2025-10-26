/**
 * Publisher Theme Configurations
 *
 * Defines three publishing experience modes:
 * - Simple Mode: Streamlined publishing with essential features
 * - Balanced Mode: Standard tools with helpful guidance
 * - Advanced Mode: Data-driven dashboard with comprehensive analytics
 */

import { AuthorThemeConfig, AuthorPersona } from '../types/persona';

// ============================================================================
// Simple Mode Theme
// ============================================================================

export const simpleModeTheme: AuthorThemeConfig = {
  name: 'simple',
  displayName: 'Simple Mode',
  description: 'Streamlined publishing experience with essential features',

  layout: {
    density: 'spacious',
    cardPadding: '6', // 32px - most spacious
    cardGap: '5',     // 24px - generous spacing
  },

  typography: {
    metricSize: '7', // Largest metric display
    labelStyle: {
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0px',
    },
  },

  colors: {
    revenue: 'var(--green-9)',
    engagement: 'var(--blue-9)',
    subscribers: 'var(--purple-9)',
    warning: 'var(--amber-9)',
  },

  preferences: {
    showAdvancedAnalytics: false,
    showContentIdeas: false,
    showSubscriberInsights: false,
    emphasizeDataVisualization: false,
    showFormHelpers: true,        // Always show helper text
    enableQuickPublish: true,      // One-click publish flow
  },
};

// ============================================================================
// Balanced Mode Theme
// ============================================================================

export const balancedModeTheme: AuthorThemeConfig = {
  name: 'balanced',
  displayName: 'Balanced Mode',
  description: 'Standard publishing tools with helpful guidance',

  layout: {
    density: 'comfortable',
    cardPadding: '4', // 16px - moderate spacing
    cardGap: '4',     // 16px - standard spacing
  },

  typography: {
    metricSize: '6', // Standard metric display
    labelStyle: {
      fontSize: '13px',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0px',
    },
  },

  colors: {
    revenue: 'var(--green-9)',
    engagement: 'var(--blue-9)',
    subscribers: 'var(--purple-9)',
    warning: 'var(--amber-9)',
  },

  preferences: {
    showAdvancedAnalytics: false,
    showContentIdeas: true,         // Show content suggestions
    showSubscriberInsights: true,   // Show subscriber analytics
    emphasizeDataVisualization: false,
    showFormHelpers: true,          // Show helpful guidance
    enableQuickPublish: false,      // Standard publish flow
  },
};

// ============================================================================
// Advanced Mode Theme
// ============================================================================

export const advancedModeTheme: AuthorThemeConfig = {
  name: 'advanced',
  displayName: 'Advanced Mode',
  description: 'Data-driven dashboard with comprehensive analytics',

  layout: {
    density: 'compact',
    cardPadding: '3', // 12px - most compact
    cardGap: '3',     // 12px - tight spacing
  },

  typography: {
    metricSize: '6', // Standard size but more metrics visible
    labelStyle: {
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },

  colors: {
    revenue: 'var(--green-9)',
    engagement: 'var(--blue-9)',
    subscribers: 'var(--purple-9)',
    warning: 'var(--amber-9)',
  },

  preferences: {
    showAdvancedAnalytics: true,       // Show detailed analytics
    showContentIdeas: true,            // Show content suggestions
    showSubscriberInsights: true,      // Show detailed subscriber data
    emphasizeDataVisualization: true,  // Charts and graphs
    showFormHelpers: false,            // Hide inline help (show on hover)
    enableQuickPublish: false,         // Full publish workflow
  },
};

// ============================================================================
// Theme Registry
// ============================================================================

export const publisherThemes: Record<AuthorPersona, AuthorThemeConfig> = {
  simple: simpleModeTheme,
  balanced: balancedModeTheme,
  advanced: advancedModeTheme,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get theme configuration for a specific persona
 * Defaults to balanced mode if persona not found
 */
export function getPublisherTheme(persona: AuthorPersona): AuthorThemeConfig {
  return publisherThemes[persona] || balancedModeTheme;
}

/**
 * Get all available publisher personas
 */
export function getAvailablePublisherPersonas(): AuthorPersona[] {
  return Object.keys(publisherThemes) as AuthorPersona[];
}
