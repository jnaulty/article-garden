/**
 * Structured logging with Pino
 *
 * Provides context-aware logging for debugging and monitoring.
 * Logs are pretty-printed in development and JSON in production.
 */

import pino from 'pino';

// Environment-based log level
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL ||
  (import.meta.env.DEV ? 'debug' : 'info');

// Browser-compatible Pino logger
export const logger = pino({
  level: LOG_LEVEL,
  browser: {
    asObject: true,
    serialize: true,
  },
  // In browser, we can't use pino-pretty transport directly
  // Instead, we format logs client-side
});

/**
 * Typed context for structured logging
 * Each log entry should include context about where it originated
 */
export interface LogContext {
  /** Domain context */
  context: 'seal' | 'walrus' | 'blockchain' | 'ui' | 'auth' | 'graphql';
  /** Operation being performed */
  operation?: string;
  /** Article ID if applicable */
  articleId?: string;
  /** Publication ID if applicable */
  publicationId?: string;
  /** Subscription ID if applicable */
  subscriptionId?: string;
  /** User/wallet address if applicable */
  userId?: string;
  /** Transaction digest if applicable */
  txDigest?: string;
  /** Blob ID if applicable */
  blobId?: string;
  /** Additional custom fields */
  [key: string]: any;
}

/**
 * Helper functions with typed context
 * Use these instead of console.log throughout the app
 */

export const logDebug = (ctx: LogContext, message: string): void => {
  logger.debug(ctx, message);
};

export const logInfo = (ctx: LogContext, message: string): void => {
  logger.info(ctx, message);
};

export const logWarn = (ctx: LogContext, message: string): void => {
  logger.warn(ctx, message);
};

export const logError = (ctx: LogContext, message: string, error?: Error | unknown): void => {
  const errorDetails = error instanceof Error ? {
    error: error.message,
    stack: error.stack,
  } : {
    error: String(error),
  };

  logger.error({ ...ctx, ...errorDetails }, message);
};

/**
 * Performance logging
 * Use to track slow operations
 */
export const logPerformance = (ctx: LogContext, message: string, durationMs: number): void => {
  logger.info({ ...ctx, durationMs }, message);
};

/**
 * Export default logger for advanced usage
 * Most code should use the helper functions above
 */
export default logger;
