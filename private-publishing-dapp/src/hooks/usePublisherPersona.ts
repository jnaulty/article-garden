/**
 * Publisher Persona Hook
 *
 * Manages publisher/author persona preferences with localStorage persistence.
 * Each wallet address has its own separate publisher preference.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { AuthorPersona } from '../types/persona';

const STORAGE_KEY_PREFIX = 'publisher-persona';
const DEFAULT_PERSONA: AuthorPersona = 'balanced';

/**
 * Hook for managing publisher persona state
 *
 * Features:
 * - Per-wallet persistence via localStorage
 * - Automatic sync when wallet changes
 * - Type-safe persona values
 * - Helper boolean flags for conditional rendering
 *
 * @example
 * ```tsx
 * const { persona, setPersona, isSimple } = usePublisherPersona();
 *
 * if (isSimple) {
 *   return <SimplifiedEditor />;
 * }
 * ```
 */
export function usePublisherPersona() {
  const account = useCurrentAccount();

  // Initialize from localStorage
  const [persona, setPersonaState] = useState<AuthorPersona>(() => {
    if (!account) return DEFAULT_PERSONA;

    const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
    const saved = localStorage.getItem(storageKey);

    // Validate saved value
    if (saved === 'simple' || saved === 'balanced' || saved === 'advanced') {
      return saved;
    }

    return DEFAULT_PERSONA;
  });

  // Update localStorage when account changes
  useEffect(() => {
    if (account) {
      const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
      const saved = localStorage.getItem(storageKey);

      if (saved === 'simple' || saved === 'balanced' || saved === 'advanced') {
        setPersonaState(saved);
      } else {
        setPersonaState(DEFAULT_PERSONA);
      }
    } else {
      // Not connected - use default
      setPersonaState(DEFAULT_PERSONA);
    }
  }, [account]);

  /**
   * Update persona and persist to localStorage
   */
  const setPersona = useCallback(
    (newPersona: AuthorPersona) => {
      setPersonaState(newPersona);

      if (account) {
        const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
        localStorage.setItem(storageKey, newPersona);

        console.log('[Persona] Publisher persona changed:', {
          persona: newPersona,
          address: account.address,
          timestamp: Date.now(),
        });
      }
    },
    [account]
  );

  /**
   * Reset to default persona
   */
  const resetPersona = useCallback(() => {
    setPersona(DEFAULT_PERSONA);
  }, [setPersona]);

  return {
    persona,
    setPersona,
    resetPersona,
    isBalanced: persona === 'balanced',
    isSimple: persona === 'simple',
    isAdvanced: persona === 'advanced',
  };
}
