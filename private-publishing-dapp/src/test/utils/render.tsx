/**
 * Custom render utility for React Testing Library
 * Automatically wraps components with TestWrapper
 */

import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { TestWrapper } from '../providers/TestWrapper';

/**
 * Custom render function that includes all providers
 *
 * Usage:
 * ```typescript
 * import { render, screen } from './test/utils/render';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: TestWrapper, ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the default render with our custom one
export { render as default };
