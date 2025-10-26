/**
 * Session storage utility for Seal SessionKey persistence
 * Pattern: messaging-sdk-example/src/utils/sessionStorage.ts
 *
 * Persists Seal session keys in browser localStorage with automatic expiry handling
 */

import type { SessionKey, ExportedSessionKey } from '@mysten/seal';
import { logger } from './logger';

interface StoredSessionData {
  sessionData: ExportedSessionKey;
  expiresAt: number;
  address: string;
  packageId: string;
}

const STORAGE_KEY_PREFIX = 'seal_session_';

/**
 * Save session key to localStorage
 * Pattern: messaging-sdk-example stores sessions with expiry metadata
 *
 * IMPORTANT: SessionKey.export() may contain non-serializable fields (like cryptographic key objects)
 * We must test each field individually and only serialize what's safe.
 * See docs/seal-session-serialization.md for details.
 */
export function saveSessionKey(
  address: string,
  packageId: string,
  sessionKey: SessionKey
): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${address}_${packageId}`;
    const exportedKey = sessionKey.export();

    // Defensive serialization: only copy fields that can be JSON stringified
    // Some fields in ExportedSessionKey may be non-serializable objects
    const serializable: any = {};

    for (const [fieldKey, value] of Object.entries(exportedKey)) {
      try {
        // Test if this specific value is serializable
        JSON.stringify(value);
        serializable[fieldKey] = value;
      } catch {
        logger.warn({
          context: 'SessionStorage',
          operation: 'serialize_field',
          field: fieldKey
        }, `Skipping non-serializable field: ${fieldKey}`);

        // Special handling for sessionKey field - convert to string representation
        if (fieldKey === 'sessionKey' && typeof value === 'object' && value !== null) {
          if ('toString' in value) {
            serializable[fieldKey] = (value as any).toString();
          }
        }
      }
    }

    // Calculate expiry: creationTimeMs + (ttlMin * 60 * 1000)
    const expiresAt = serializable.creationTimeMs + (serializable.ttlMin * 60 * 1000);

    const data: StoredSessionData = {
      sessionData: serializable as ExportedSessionKey,
      expiresAt,
      address,
      packageId,
    };

    localStorage.setItem(key, JSON.stringify(data));
    logger.info({
      context: 'SessionStorage',
      operation: 'save_session',
      address,
      packageId
    }, 'Session key saved successfully');
  } catch (error) {
    logger.error({
      context: 'SessionStorage',
      operation: 'save_session',
      error,
      address,
      packageId
    }, 'Failed to save session key');
    throw error;
  }
}

/**
 * Load session key from localStorage
 * Returns null if not found or expired
 */
export function loadSessionKey(
  address: string,
  packageId: string
): ExportedSessionKey | null {
  const key = `${STORAGE_KEY_PREFIX}${address}_${packageId}`;
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    const data: StoredSessionData = JSON.parse(stored);

    // Check if expired
    if (Date.now() >= data.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return data.sessionData;
  } catch (error) {
    logger.error({
      context: 'SessionStorage',
      operation: 'load_session',
      error,
      address,
      packageId
    }, 'Failed to parse stored session');
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Clear session for specific address/package
 */
export function clearSessionKey(address: string, packageId: string): void {
  const key = `${STORAGE_KEY_PREFIX}${address}_${packageId}`;
  localStorage.removeItem(key);
}

/**
 * Clear all expired sessions on app startup
 */
export function clearAllExpiredSessions(): void {
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data: StoredSessionData = JSON.parse(stored);
          if (now >= data.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      }
    }
  }
}
