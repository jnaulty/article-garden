/**
 * Test utilities barrel export
 * Convenient single import for all test helpers
 */

// Re-export render utilities
export * from './render';

// Re-export Testing Library utilities
export { waitFor, waitForElementToBeRemoved, within, screen } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

/**
 * Helper to wait for async operations
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to create a delayed promise (for testing loading states)
 */
export const createDelayedPromise = <T,>(value: T, delay: number): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), delay));

/**
 * Helper to create a rejected promise (for testing error states)
 */
export const createRejectedPromise = (error: Error, delay = 0): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(error), delay));
