/**
 * Seal Session Provider
 * Pattern: messaging-sdk-example/src/providers/SessionKeyProvider.tsx
 *
 * Manages Seal session lifecycle with auto-load from cache
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { SessionKey } from '@mysten/seal';
import {
  loadSessionKey,
  saveSessionKey,
  clearSessionKey,
  clearAllExpiredSessions
} from '../utils/sessionStorage';
import { useNetworkVariable } from '../networkConfig';
import { logger } from '../utils/logger';

interface SealSessionContextProps {
  sessionKey: SessionKey | null;
  isInitializing: boolean;
  error: Error | null;
  clearSession: () => void;
  initializeSession: () => Promise<void>;
}

const SealSessionContext = createContext<SealSessionContextProps | undefined>(undefined);

// TODO: Update with actual deployed package ID
// For now, use a placeholder that will be updated after deployment
const SESSION_TTL_MINUTES = 30;

export const SealSessionProvider = ({ children }: { children: ReactNode }) => {
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const packageId = useNetworkVariable('packageId');

  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Clear expired sessions on mount
  useEffect(() => {
    clearAllExpiredSessions();
  }, []);

  /**
   * Initialize new session by requesting user signature
   * Pattern: messaging-sdk-example creates session on demand
   */
  const initializeSession = async () => {
    if (!currentAccount?.address) {
      setSessionKey(null);
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      logger.info({
        context: 'SealSession',
        operation: 'create_session',
        address: currentAccount.address,
        packageId,
        ttl: SESSION_TTL_MINUTES
      }, 'Creating new session key');

      // Create new session
      const newSessionKey = await SessionKey.create({
        address: currentAccount.address,
        packageId,
        ttlMin: SESSION_TTL_MINUTES,
        suiClient,
      });

      // Request user signature
      const message = await signPersonalMessage({
        message: newSessionKey.getPersonalMessage(),
      });

      // Set signature on session
      await newSessionKey.setPersonalMessageSignature(message.signature);

      // Save to localStorage
      saveSessionKey(currentAccount.address, packageId, newSessionKey);

      logger.info({
        context: 'SealSession',
        operation: 'session_saved',
        address: currentAccount.address,
        packageId
      }, 'Session created and saved');

      setSessionKey(newSessionKey);
    } catch (err) {
      logger.error({
        context: 'SealSession',
        operation: 'initialize_session',
        error: err,
        address: currentAccount.address
      }, 'Error initializing session');
      setError(err instanceof Error ? err : new Error('Failed to initialize session'));
      setSessionKey(null);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Try to load cached session on account change
   * Pattern: messaging-sdk-example auto-loads cached sessions
   */
  useEffect(() => {
    const loadCachedSession = async () => {
      if (!currentAccount?.address) {
        setSessionKey(null);
        return;
      }

      const cachedSessionData = loadSessionKey(currentAccount.address, packageId);

      if (cachedSessionData) {
        logger.info({
          context: 'SealSession',
          operation: 'load_cached',
          address: currentAccount.address,
          packageId
        }, 'Loading cached session');

        try {
          const restoredSessionKey = SessionKey.import(cachedSessionData, suiClient);

          if (!restoredSessionKey.isExpired()) {
            setSessionKey(restoredSessionKey);
            logger.info({
              context: 'SealSession',
              operation: 'session_restored',
              address: currentAccount.address
            }, 'Cached session loaded successfully');
            return;
          } else {
            logger.info({
              context: 'SealSession',
              operation: 'session_expired',
              address: currentAccount.address
            }, 'Cached session expired');
            clearSessionKey(currentAccount.address, packageId);
            setSessionKey(null);
          }
        } catch (error) {
          logger.error({
            context: 'SealSession',
            operation: 'import_session',
            error,
            address: currentAccount.address
          }, 'Failed to import cached session');
          clearSessionKey(currentAccount.address, packageId);
          setSessionKey(null);
        }
      } else {
        logger.info({
          context: 'SealSession',
          operation: 'load_cached',
          address: currentAccount.address
        }, 'No cached session found');
        setSessionKey(null);
      }
    };

    loadCachedSession();
  }, [currentAccount?.address, packageId, suiClient]);

  /**
   * Clear session on wallet disconnect
   */
  useEffect(() => {
    if (!currentAccount?.address && sessionKey) {
      logger.info({
        context: 'SealSession',
        operation: 'wallet_disconnect'
      }, 'Wallet disconnected, clearing session');
      setSessionKey(null);
    }
  }, [currentAccount?.address, sessionKey]);

  const clearSession = () => {
    if (currentAccount?.address) {
      clearSessionKey(currentAccount.address, packageId);
      setSessionKey(null);
    }
  };

  return (
    <SealSessionContext.Provider
      value={{
        sessionKey,
        isInitializing,
        error,
        clearSession,
        initializeSession
      }}
    >
      {children}
    </SealSessionContext.Provider>
  );
};

export const useSealSession = () => {
  const context = useContext(SealSessionContext);
  if (context === undefined) {
    throw new Error('useSealSession must be used within a SealSessionProvider');
  }
  return context;
};
