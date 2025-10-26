/**
 * Test mocks barrel export
 * Convenient single import for all mocks
 */

// Export all Seal mocks
export * from './seal';

// Export all Walrus mocks
export * from './walrus';

// Export all Dapp-Kit mocks
export * from './dapp-kit';

// Export Seal Session mocks
export * from './seal-session';

/**
 * Reset all mocks helper
 * Call this in beforeEach() to ensure clean state
 */
import { resetSealMocks } from './seal';
import { resetWalrusMocks } from './walrus';
import { resetDappKitMocks } from './dapp-kit';
import { resetSealSessionMocks } from './seal-session';

export const resetAllMocks = (): void => {
  resetSealMocks();
  resetWalrusMocks();
  resetDappKitMocks();
  resetSealSessionMocks();
};
