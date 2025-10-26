/**
 * Publisher Theme Context
 *
 * Provides publisher theme configuration throughout the app based on the user's
 * selected persona (Simple, Balanced, or Advanced mode).
 */

import { createContext, useContext, ReactNode } from 'react';
import { AuthorThemeConfig } from '../types/persona';
import { usePublisherPersona } from '../hooks/usePublisherPersona';
import { getPublisherTheme } from '../themes/publisherThemes';

// ============================================================================
// Context Creation
// ============================================================================

const PublisherThemeContext = createContext<AuthorThemeConfig | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Publisher Theme Provider
 *
 * Wraps publisher-facing parts of the app to provide theme configuration
 * based on the user's selected persona.
 *
 * @example
 * ```tsx
 * <PublisherThemeProvider>
 *   <DashboardPage />
 *   <ArticleEditor />
 * </PublisherThemeProvider>
 * ```
 */
export function PublisherThemeProvider({ children }: { children: ReactNode }) {
  const { persona } = usePublisherPersona();
  const theme = getPublisherTheme(persona);

  return (
    <PublisherThemeContext.Provider value={theme}>
      {children}
    </PublisherThemeContext.Provider>
  );
}

// ============================================================================
// Hook: usePublisherTheme
// ============================================================================

/**
 * Access the complete publisher theme configuration
 *
 * @throws Error if used outside PublisherThemeProvider
 *
 * @example
 * ```tsx
 * const theme = usePublisherTheme();
 * console.log(theme.displayName); // "Simple Mode"
 * ```
 */
export function usePublisherTheme(): AuthorThemeConfig {
  const context = useContext(PublisherThemeContext);

  if (!context) {
    throw new Error('usePublisherTheme must be used within PublisherThemeProvider');
  }

  return context;
}

// ============================================================================
// Helper Hooks for Specific Theme Sections
// ============================================================================

/**
 * Access layout configuration (density, padding, gaps)
 *
 * @example
 * ```tsx
 * const layout = usePublisherLayout();
 * return <Card p={layout.cardPadding}> ... </Card>;
 * ```
 */
export function usePublisherLayout() {
  const theme = usePublisherTheme();
  return theme.layout;
}

/**
 * Access typography configuration (sizes, weights, transforms)
 *
 * @example
 * ```tsx
 * const typography = usePublisherTypography();
 * return <Text size={typography.metricSize}>{metric}</Text>;
 * ```
 */
export function usePublisherTypography() {
  const theme = usePublisherTheme();
  return theme.typography;
}

/**
 * Access user preferences (feature visibility, behavior settings)
 *
 * @example
 * ```tsx
 * const preferences = usePublisherPreferences();
 * if (preferences.showFormHelpers) {
 *   return <HelpText>...</HelpText>;
 * }
 * ```
 */
export function usePublisherPreferences() {
  const theme = usePublisherTheme();
  return theme.preferences;
}

/**
 * Access color configuration for metrics and data visualization
 *
 * @example
 * ```tsx
 * const colors = usePublisherColors();
 * return <Box style={{ color: colors.revenue }}>...</Box>;
 * ```
 */
export function usePublisherColors() {
  const theme = usePublisherTheme();
  return theme.colors;
}
