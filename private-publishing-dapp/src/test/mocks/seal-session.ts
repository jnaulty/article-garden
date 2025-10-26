/**
 * Mock for SealSessionProvider
 * Provides mock session key state for tests
 */

import { vi } from 'vitest';
import { mockSessionKey, mockExpiredSessionKey } from './seal';

/**
 * Mock useSealSession hook (returns ready session)
 */
export const mockUseSealSession = vi.fn(() => ({
  sessionKey: mockSessionKey,
  isInitializing: false,
  initializeSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn(),
}));

/**
 * Mock useSealSession hook (initializing)
 */
export const mockUseSealSessionInitializing = vi.fn(() => ({
  sessionKey: null,
  isInitializing: true,
  initializeSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn(),
}));

/**
 * Mock useSealSession hook (not initialized)
 */
export const mockUseSealSessionNotInitialized = vi.fn(() => ({
  sessionKey: null,
  isInitializing: false,
  initializeSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn(),
}));

/**
 * Mock useSealSession hook (expired session)
 */
export const mockUseSealSessionExpired = vi.fn(() => ({
  sessionKey: mockExpiredSessionKey,
  isInitializing: false,
  initializeSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn(),
}));

/**
 * Helper to reset seal session mocks
 */
export const resetSealSessionMocks = (): void => {
  mockUseSealSession.mockClear();
  mockUseSealSessionInitializing.mockClear();
  mockUseSealSessionNotInitialized.mockClear();
  mockUseSealSessionExpired.mockClear();
};
