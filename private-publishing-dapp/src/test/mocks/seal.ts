/**
 * Mock implementations for @mysten/seal SDK
 * Used in service and hook tests
 */

import { vi } from 'vitest';

/**
 * Mock SessionKey
 */
export const mockSessionKey = {
  isExpired: vi.fn().mockReturnValue(false),
  publicKey: new Uint8Array(32),
  expiresAt: Date.now() + 3600000, // 1 hour from now
};

/**
 * Mock expired SessionKey
 */
export const mockExpiredSessionKey = {
  isExpired: vi.fn().mockReturnValue(true),
  publicKey: new Uint8Array(32),
  expiresAt: Date.now() - 3600000, // 1 hour ago
};

/**
 * Mock SealClient with encrypt/decrypt methods
 */
export const mockSealClient = {
  encrypt: vi.fn().mockResolvedValue({
    encryptedObject: new Uint8Array([
      // Mock BCS-serialized encrypted object
      // In reality this would be much longer
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
      0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
      0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
    ]),
    key: new Uint8Array([
      // Mock symmetric backup key
      0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8,
      0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf, 0xb0,
    ]),
  }),
  decrypt: vi.fn().mockResolvedValue(
    // Mock decrypted content (plaintext article)
    new TextEncoder().encode('This is the decrypted article content')
  ),
};

/**
 * Mock EncryptedObject parser
 * Simulates parsing BCS-serialized encrypted object
 */
export const mockEncryptedObjectParsed = {
  id: 'abc123def456', // Article ID (hex string)
  packageId: '0xpackage123',
  threshold: 2,
  services: [
    ['0xkeyserver1', 1],
    ['0xkeyserver2', 1],
  ] as [string, number][],
};

/**
 * Mock EncryptedObject.parse() function
 */
export const mockEncryptedObjectParse = vi.fn().mockReturnValue(mockEncryptedObjectParsed);

/**
 * Mock SealClient.asClientExtension()
 * Returns an extension that can be registered with SuiClient
 */
export const mockAsClientExtension = vi.fn(() => ({
  register: vi.fn(() => mockSealClient),
}));

/**
 * Mock the entire @mysten/seal module
 * Use this in tests with: vi.mock('@mysten/seal')
 */
export const mockSealModule = {
  SealClient: {
    asClientExtension: mockAsClientExtension,
  },
  EncryptedObject: {
    parse: mockEncryptedObjectParse,
  },
  SessionKey: vi.fn().mockImplementation(() => mockSessionKey),
};

/**
 * Helper to reset all Seal mocks
 */
export const resetSealMocks = (): void => {
  mockSealClient.encrypt.mockClear();
  mockSealClient.decrypt.mockClear();
  mockEncryptedObjectParse.mockClear();
  mockAsClientExtension.mockClear();
  mockSessionKey.isExpired.mockReturnValue(false);
};

/**
 * Helper to simulate encryption failure
 */
export const mockEncryptionError = (errorMessage: string): void => {
  mockSealClient.encrypt.mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Helper to simulate decryption failure
 */
export const mockDecryptionError = (errorMessage: string): void => {
  mockSealClient.decrypt.mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Helper to simulate empty key servers in encrypted object
 */
export const mockEmptyKeyServers = (): void => {
  mockEncryptedObjectParse.mockReturnValueOnce({
    ...mockEncryptedObjectParsed,
    services: [], // No key servers - should cause decryption to fail
  });
};
