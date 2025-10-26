/**
 * useReaderPersona Hook
 *
 * Manages reader persona preference with localStorage persistence.
 * Stores preference per wallet address.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ReaderPersona } from '../types/persona';

const STORAGE_KEY_PREFIX = 'reader-persona';
const DEFAULT_PERSONA: ReaderPersona = 'default';

export function useReaderPersona() {
  const account = useCurrentAccount();

  // Initialize from localStorage
  const [persona, setPersonaState] = useState<ReaderPersona>(() => {
    if (!account) return DEFAULT_PERSONA;

    const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
    const saved = localStorage.getItem(storageKey);

    // Validate saved value
    if (saved === 'casual' || saved === 'dedicated' || saved === 'default') {
      return saved;
    }

    return DEFAULT_PERSONA;
  });

  // Update localStorage when account changes
  useEffect(() => {
    if (account) {
      const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
      const saved = localStorage.getItem(storageKey);

      if (saved === 'casual' || saved === 'dedicated' || saved === 'default') {
        setPersonaState(saved);
      } else {
        setPersonaState(DEFAULT_PERSONA);
      }
    } else {
      // No account connected - use default
      setPersonaState(DEFAULT_PERSONA);
    }
  }, [account]);

  // Update persona and persist to localStorage
  const setPersona = useCallback(
    (newPersona: ReaderPersona) => {
      setPersonaState(newPersona);

      if (account) {
        const storageKey = `${STORAGE_KEY_PREFIX}-${account.address}`;
        localStorage.setItem(storageKey, newPersona);

        // Optional: Track persona change for analytics
        console.log('[Persona] Reader persona changed:', {
          persona: newPersona,
          address: account.address,
          timestamp: Date.now(),
        });
      }
    },
    [account]
  );

  // Reset to default
  const resetPersona = useCallback(() => {
    setPersona(DEFAULT_PERSONA);
  }, [setPersona]);

  return {
    persona,
    setPersona,
    resetPersona,
    isDefault: persona === 'default',
    isCasual: persona === 'casual',
    isDedicated: persona === 'dedicated',
  };
}
