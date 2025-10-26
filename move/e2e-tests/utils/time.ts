/**
 * Time utilities for testing expiry and time-dependent features
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SECONDS_PER_MONTH, SECONDS_PER_DAY, MS_PER_SECOND } from './constants.js';

/**
 * Get current blockchain timestamp in seconds
 */
export async function getCurrentTimestamp(client: SuiClient): Promise<number> {
  // In Sui, we can get the current epoch time
  // For testing, we'll use the local system time as an approximation
  return Math.floor(Date.now() / MS_PER_SECOND);
}

/**
 * Calculate expiry timestamp (current time + duration in seconds)
 */
export function calculateExpiry(currentTimestamp: number, durationSeconds: number): number {
  return currentTimestamp + durationSeconds;
}

/**
 * Calculate subscription expiry (30 days from now)
 */
export async function calculateSubscriptionExpiry(client: SuiClient): Promise<number> {
  const now = await getCurrentTimestamp(client);
  return calculateExpiry(now, SECONDS_PER_MONTH);
}

/**
 * Calculate read token expiry (24 hours from now)
 */
export async function calculateReadTokenExpiry(client: SuiClient): Promise<number> {
  const now = await getCurrentTimestamp(client);
  return calculateExpiry(now, SECONDS_PER_DAY);
}

/**
 * Check if a timestamp has expired
 */
export function isExpired(expiryTimestamp: number, currentTimestamp: number): boolean {
  return currentTimestamp > expiryTimestamp;
}

/**
 * Wait for a specific duration (for testing purposes)
 */
export async function waitSeconds(seconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, seconds * MS_PER_SECOND));
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * MS_PER_SECOND).toISOString();
}

/**
 * Get a timestamp in the past (for testing expired scenarios)
 */
export async function getPastTimestamp(client: SuiClient, secondsAgo: number): Promise<number> {
  const now = await getCurrentTimestamp(client);
  return now - secondsAgo;
}

/**
 * Get a timestamp in the future (for testing valid scenarios)
 */
export async function getFutureTimestamp(client: SuiClient, secondsAhead: number): Promise<number> {
  const now = await getCurrentTimestamp(client);
  return now + secondsAhead;
}
