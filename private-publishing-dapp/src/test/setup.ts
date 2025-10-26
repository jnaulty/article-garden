/**
 * Vitest test setup
 * Runs before each test file
 */

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test (unmount React components)
afterEach(() => {
  cleanup();
});

// Suppress logs during tests (can be overridden with VITE_LOG_LEVEL env var)
// This will be used once we implement the logger
if (!import.meta.env.VITE_LOG_LEVEL) {
  import.meta.env.VITE_LOG_LEVEL = 'error';
}

// Mock window.matchMedia for Radix UI components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver (used by some UI components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock crypto.getRandomValues (already exists in Node 20+, but this ensures compatibility)
if (!global.crypto) {
  (global as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}
