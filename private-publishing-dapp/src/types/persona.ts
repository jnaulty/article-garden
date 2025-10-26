/**
 * Persona Types
 *
 * Defines user persona types and theme configurations for both reader and author experiences.
 */

// Reader Personas
export type ReaderPersona = 'casual' | 'dedicated' | 'default';

// Author Personas
export type AuthorPersona = 'simple' | 'balanced' | 'advanced';

/**
 * Reader Theme Configuration
 *
 * Based on design variations:
 * - Casual: Variation 1 - Minimalist, discovery-focused, large imagery
 * - Dedicated: Variation 2 - Balanced, content-focused, personalized feed
 */
export interface ReaderThemeConfig {
  name: ReaderPersona;
  displayName: string;
  description: string;

  // Layout configuration
  layout: {
    density: 'spacious' | 'balanced' | 'compact';
    cardPadding: string; // Radix spacing value (e.g., "4", "5", "6")
    cardGap: string;
    containerSize: '1' | '2' | '3' | '4'; // Radix container sizes
  };

  // Typography configuration
  typography: {
    headingSize: '6' | '7' | '8' | '9';
    bodySize: '2' | '3' | '4';
    emphasisWeight: 'regular' | 'medium' | 'bold';
    lineHeight: 'normal' | 'relaxed' | 'loose';
  };

  // Component visibility
  features: {
    showReadingProgress: boolean;
    showContinueReading: boolean;
    showArticleMetadata: boolean;
    showPublicationBranding: boolean;
    emphasizeImagery: boolean;
  };

  // Navigation preferences
  navigation: {
    style: 'minimal' | 'standard' | 'detailed';
    feedFirst: boolean; // True for dedicated subscribers
    browseFirst: boolean; // True for casual readers
  };
}

/**
 * Author Theme Configuration
 */
export interface AuthorThemeConfig {
  name: AuthorPersona;
  displayName: string;
  description: string;

  // Dashboard layout
  layout: {
    density: 'spacious' | 'comfortable' | 'compact';
    cardPadding: string;
    cardGap: string;
  };

  // Typography for metrics and analytics
  typography: {
    metricSize: string; // Radix size value (e.g., "6", "7")
    labelStyle: {
      fontSize: string;
      fontWeight: number;
      textTransform: 'none' | 'uppercase';
      letterSpacing: string;
    };
  };

  // Color coding for metrics
  colors: {
    revenue: string; // CSS variable
    engagement: string;
    subscribers: string;
    warning: string;
  };

  // Dashboard preferences
  preferences: {
    showAdvancedAnalytics: boolean;
    showContentIdeas: boolean;
    showSubscriberInsights: boolean;
    emphasizeDataVisualization: boolean;
    showFormHelpers: boolean;
    enableQuickPublish: boolean;
  };
}

/**
 * User Preferences
 *
 * Stored in localStorage per wallet address
 */
export interface UserPersonaPreferences {
  readerPersona: ReaderPersona;
  authorPersona: AuthorPersona;
  lastUpdated: number;
}
