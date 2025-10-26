/**
 * Reader Theme Context
 *
 * Provides reader theme configuration to components based on user's selected persona.
 * Components can consume the theme using the useReaderTheme() hook.
 */

import { createContext, useContext, ReactNode } from 'react';
import { ReaderThemeConfig } from '../types/persona';
import { useReaderPersona } from '../hooks/useReaderPersona';
import { getReaderTheme } from '../themes/readerThemes';

// Create context
const ReaderThemeContext = createContext<ReaderThemeConfig | null>(null);

/**
 * Reader Theme Provider
 *
 * Wraps the application and provides theme configuration based on user's persona preference.
 */
export function ReaderThemeProvider({ children }: { children: ReactNode }) {
  const { persona } = useReaderPersona();
  const theme = getReaderTheme(persona);

  return (
    <ReaderThemeContext.Provider value={theme}>
      {children}
    </ReaderThemeContext.Provider>
  );
}

/**
 * useReaderTheme Hook
 *
 * Access the current reader theme configuration in any component.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useReaderTheme();
 *
 *   return (
 *     <Card style={{ padding: theme.layout.cardPadding }}>
 *       <Heading size={theme.typography.headingSize}>
 *         Title
 *       </Heading>
 *     </Card>
 *   );
 * }
 * ```
 */
export function useReaderTheme(): ReaderThemeConfig {
  const context = useContext(ReaderThemeContext);

  if (!context) {
    throw new Error('useReaderTheme must be used within ReaderThemeProvider');
  }

  return context;
}

/**
 * Conditional Feature Rendering Hook
 *
 * Helper hook to conditionally render features based on theme configuration.
 *
 * @example
 * ```tsx
 * function ArticleCard({ article }) {
 *   const { showReadingProgress } = useReaderFeatures();
 *
 *   return (
 *     <Card>
 *       <Heading>{article.title}</Heading>
 *       {showReadingProgress && <ProgressBar value={article.progress} />}
 *     </Card>
 *   );
 * }
 * ```
 */
export function useReaderFeatures() {
  const theme = useReaderTheme();
  return theme.features;
}

/**
 * Theme-aware Layout Hook
 *
 * Helper hook to get layout configuration.
 *
 * @example
 * ```tsx
 * function PublicationGrid() {
 *   const { cardPadding, cardGap, containerSize } = useReaderLayout();
 *
 *   return (
 *     <Container size={containerSize}>
 *       <Grid gap={cardGap}>
 *         <Card p={cardPadding}>Content</Card>
 *       </Grid>
 *     </Container>
 *   );
 * }
 * ```
 */
export function useReaderLayout() {
  const theme = useReaderTheme();
  return theme.layout;
}

/**
 * Theme-aware Typography Hook
 *
 * Helper hook to get typography configuration.
 */
export function useReaderTypography() {
  const theme = useReaderTheme();
  return theme.typography;
}
