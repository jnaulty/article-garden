/**
 * Mock implementations for @mysten/walrus SDK
 * Used in service and hook tests
 */

import { vi } from 'vitest';

/**
 * Mock WalrusFile
 */
export const mockWalrusFile = {
  blobId: 'mock-blob-id-abc123',
  identifier: 'encrypted-article.bin',
  bytes: vi.fn().mockResolvedValue(
    new Uint8Array([
      // Mock encrypted article data
      0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,
    ])
  ),
};

/**
 * Mock WriteFilesFlow
 * Simulates the 4-step upload process
 */
export const mockWriteFilesFlow = {
  encode: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockReturnValue({
    // Returns a Transaction object
    build: vi.fn().mockResolvedValue(new Uint8Array()),
  }),
  upload: vi.fn().mockResolvedValue(undefined),
  certify: vi.fn().mockReturnValue({
    // Returns a Transaction object
    build: vi.fn().mockResolvedValue(new Uint8Array()),
  }),
  listFiles: vi.fn().mockResolvedValue([mockWalrusFile]),
};

/**
 * Mock WalrusBlob (for reading)
 */
export const mockWalrusBlob = {
  files: vi.fn().mockResolvedValue([mockWalrusFile]),
};

/**
 * Mock WalrusClient
 */
export const mockWalrusClient = {
  writeFilesFlow: vi.fn(() => mockWriteFilesFlow),
  getBlob: vi.fn().mockResolvedValue(mockWalrusBlob),
  getBlobMetadata: vi.fn().mockResolvedValue({
    blobId: 'mock-blob-id-abc123',
    metadata: {
      V1: {
        unencoded_length: '1024',
      },
    },
  }),
};

/**
 * Mock WalrusFile.from() static method
 */
export const mockWalrusFileFrom = vi.fn((params) => params);

/**
 * Mock the entire @mysten/walrus module
 * Use this in tests with: vi.mock('@mysten/walrus')
 */
export const mockWalrusModule = {
  WalrusClient: vi.fn(() => mockWalrusClient),
  WalrusFile: {
    from: mockWalrusFileFrom,
  },
};

/**
 * Helper to reset all Walrus mocks
 */
export const resetWalrusMocks = (): void => {
  mockWriteFilesFlow.encode.mockClear();
  mockWriteFilesFlow.register.mockClear();
  mockWriteFilesFlow.upload.mockClear();
  mockWriteFilesFlow.certify.mockClear();
  mockWriteFilesFlow.listFiles.mockClear();
  mockWalrusClient.writeFilesFlow.mockClear();
  mockWalrusClient.getBlob.mockClear();
  mockWalrusClient.getBlobMetadata.mockClear();
  mockWalrusBlob.files.mockClear();
  mockWalrusFile.bytes.mockClear();
  mockWalrusFileFrom.mockClear();
};

/**
 * Helper to simulate upload failure
 */
export const mockUploadError = (errorMessage: string): void => {
  mockWriteFilesFlow.upload.mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Helper to simulate registration failure (no digest)
 */
export const mockRegistrationNoDigest = (): void => {
  // Simulate transaction result without digest
  mockWriteFilesFlow.register.mockReturnValueOnce({
    build: vi.fn().mockResolvedValue(new Uint8Array()),
  });
};

/**
 * Helper to simulate blob not found
 */
export const mockBlobNotFound = (): void => {
  mockWalrusClient.getBlob.mockRejectedValueOnce(new Error('Blob not found'));
};

/**
 * Helper to simulate missing file in quilt
 */
export const mockMissingFileInQuilt = (): void => {
  mockWalrusBlob.files.mockResolvedValueOnce([]); // No files found
};

/**
 * Helper to simulate metadata not found
 */
export const mockMetadataNotFound = (): void => {
  mockWalrusClient.getBlobMetadata.mockRejectedValueOnce(new Error('Metadata not found'));
};

/**
 * Mock successful upload result
 */
export const mockUploadResult = {
  blobId: 'mock-blob-id-abc123',
  size: 1024,
};
