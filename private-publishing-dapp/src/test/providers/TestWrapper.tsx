/**
 * Test wrapper component
 * Provides all necessary React contexts for testing hooks and components
 */

import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@radix-ui/themes';
import { vi } from 'vitest';

/**
 * Test-specific QueryClient
 * - Disables retries for faster tests
 * - Disables caching to avoid test pollution
 * - Suppresses error logging
 */
export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
});

/**
 * TestWrapper component
 * Wraps test components with all necessary providers
 *
 * Usage:
 * ```typescript
 * import { renderHook } from '@testing-library/react';
 * import { TestWrapper } from './test/providers/TestWrapper';
 *
 * const { result } = renderHook(() => useMyHook(), {
 *   wrapper: TestWrapper,
 * });
 * ```
 */
export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <Theme>
          {children}
        </Theme>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Reset function to clear QueryClient between tests
 */
export const resetTestQueryClient = (): void => {
  testQueryClient.clear();
};
