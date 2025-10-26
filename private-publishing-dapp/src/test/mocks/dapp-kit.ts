/**
 * Mock implementations for @mysten/dapp-kit hooks
 * Used in component and hook tests
 */

import { vi } from 'vitest';
import type { SuiClient } from '@mysten/sui/client';

/**
 * Mock current account
 */
export const mockAccount = {
  address: '0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  publicKey: new Uint8Array(32),
  chains: ['sui:testnet'],
  features: ['sui:signAndExecuteTransaction'],
};

/**
 * Mock useCurrentAccount hook
 */
export const mockUseCurrentAccount = vi.fn(() => mockAccount);

/**
 * Mock transaction result
 */
export const mockTransactionResult = {
  digest: 'mock-digest-abc123xyz',
  effects: {
    status: { status: 'success' as const },
  },
  events: [],
  objectChanges: [],
  balanceChanges: [],
};

/**
 * Mock signAndExecute function
 */
export const mockSignAndExecute = vi.fn().mockResolvedValue(mockTransactionResult);

/**
 * Mock useSignAndExecuteTransaction hook
 */
export const mockUseSignAndExecuteTransaction = vi.fn(() => ({
  mutateAsync: mockSignAndExecute,
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
}));

/**
 * Mock SuiClient
 */
export const mockSuiClient = {
  getObject: vi.fn().mockResolvedValue({
    data: {
      objectId: '0xobject123',
      version: '1',
      digest: 'digest123',
      type: 'test::type::Object',
      owner: { AddressOwner: mockAccount.address },
      content: {
        dataType: 'moveObject',
        type: 'test::type::Object',
        hasPublicTransfer: true,
        fields: {},
      },
    },
  }),
  multiGetObjects: vi.fn().mockResolvedValue([]),
  queryEvents: vi.fn().mockResolvedValue({
    data: [],
    hasNextPage: false,
  }),
  executeTransactionBlock: vi.fn().mockResolvedValue(mockTransactionResult),
  dryRunTransactionBlock: vi.fn().mockResolvedValue({
    effects: { status: { status: 'success' } },
  }),
} as unknown as SuiClient;

/**
 * Mock useSuiClient hook
 */
export const mockUseSuiClient = vi.fn(() => mockSuiClient);

/**
 * Mock useSuiClientQuery hook
 */
export const mockUseSuiClientQuery = vi.fn((method, params) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}));

/**
 * Mock useSuiClientInfiniteQuery hook
 */
export const mockUseSuiClientInfiniteQuery = vi.fn(() => ({
  data: { pages: [], pageParams: [] },
  isLoading: false,
  isError: false,
  error: null,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
}));

/**
 * Helper to reset all dapp-kit mocks
 */
export const resetDappKitMocks = (): void => {
  mockUseCurrentAccount.mockClear();
  mockSignAndExecute.mockClear();
  mockUseSignAndExecuteTransaction.mockClear();
  mockUseSuiClient.mockClear();
  mockUseSuiClientQuery.mockClear();
  mockUseSuiClientInfiniteQuery.mockClear();
  mockSuiClient.getObject.mockClear();
  mockSuiClient.multiGetObjects.mockClear();
  mockSuiClient.queryEvents.mockClear();
  mockSuiClient.executeTransactionBlock?.mockClear?.();
  mockSuiClient.dryRunTransactionBlock?.mockClear?.();
};

/**
 * Helper to simulate no connected account
 */
export const mockNoAccount = (): void => {
  mockUseCurrentAccount.mockReturnValueOnce(null);
};

/**
 * Helper to simulate transaction failure
 */
export const mockTransactionError = (errorMessage: string): void => {
  mockSignAndExecute.mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Helper to simulate pending transaction
 */
export const mockPendingTransaction = (): void => {
  mockUseSignAndExecuteTransaction.mockReturnValueOnce({
    mutateAsync: mockSignAndExecute,
    mutate: vi.fn(),
    isPending: true,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    reset: vi.fn(),
  });
};
