/**
 * Smoke test to verify Vitest setup is working
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have global test APIs available', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have crypto.getRandomValues available', () => {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    expect(arr.some(byte => byte > 0)).toBe(true);
  });
});
