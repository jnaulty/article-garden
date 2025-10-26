/**
 * Tests for structured logging utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger, logDebug, logInfo, logWarn, logError, logPerformance } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear any previous calls
    vi.clearAllMocks();
  });

  it('should export logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it('should log debug messages with context', () => {
    const debugSpy = vi.spyOn(logger, 'debug');

    logDebug({ context: 'seal', operation: 'encrypt' }, 'Encrypting content');

    expect(debugSpy).toHaveBeenCalledWith(
      { context: 'seal', operation: 'encrypt' },
      'Encrypting content'
    );
  });

  it('should log info messages with context', () => {
    const infoSpy = vi.spyOn(logger, 'info');

    logInfo({ context: 'walrus', operation: 'upload' }, 'Upload complete');

    expect(infoSpy).toHaveBeenCalledWith(
      { context: 'walrus', operation: 'upload' },
      'Upload complete'
    );
  });

  it('should log warnings with context', () => {
    const warnSpy = vi.spyOn(logger, 'warn');

    logWarn({ context: 'blockchain', operation: 'transaction' }, 'High gas price');

    expect(warnSpy).toHaveBeenCalledWith(
      { context: 'blockchain', operation: 'transaction' },
      'High gas price'
    );
  });

  it('should log errors with error details', () => {
    const errorSpy = vi.spyOn(logger, 'error');
    const testError = new Error('Test error message');

    logError(
      { context: 'seal', operation: 'decrypt' },
      'Decryption failed',
      testError
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'seal',
        operation: 'decrypt',
        error: 'Test error message',
        stack: expect.any(String),
      }),
      'Decryption failed'
    );
  });

  it('should handle non-Error objects in logError', () => {
    const errorSpy = vi.spyOn(logger, 'error');

    logError(
      { context: 'ui', operation: 'render' },
      'Render failed',
      'String error'
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'ui',
        operation: 'render',
        error: 'String error',
      }),
      'Render failed'
    );
  });

  it('should log performance metrics', () => {
    const infoSpy = vi.spyOn(logger, 'info');

    logPerformance(
      { context: 'walrus', operation: 'upload' },
      'Upload completed',
      1234
    );

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'walrus',
        operation: 'upload',
        durationMs: 1234,
      }),
      'Upload completed'
    );
  });

  it('should support custom context fields', () => {
    const infoSpy = vi.spyOn(logger, 'info');

    logInfo(
      {
        context: 'blockchain',
        operation: 'publish',
        articleId: 'abc123',
        blobId: 'blob456',
        txDigest: 'tx789',
      },
      'Article published'
    );

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'blockchain',
        operation: 'publish',
        articleId: 'abc123',
        blobId: 'blob456',
        txDigest: 'tx789',
      }),
      'Article published'
    );
  });
});
