/**
 * Contract constants and configuration
 * Update packageId after deploying the Move package
 */

// Module names from the Move package
export const MODULES = {
  PUBLICATION: "publication",
  SUBSCRIPTION: "subscription",
  ARTICLE: "article",
  ACCESS_CONTROL: "access_control",
  ANALYTICS: "analytics",
  MARKETPLACE_POLICIES: "marketplace_policies",
  SEAL_POLICY: "seal_policy",
} as const;

// Pricing constants (in MIST, 1 SUI = 1_000_000_000 MIST)
export const PRICING = {
  FREE: 0n,
  BASIC_MONTHLY: 5_000_000_000n,  // 5 SUI
  PREMIUM_MONTHLY: 15_000_000_000n, // 15 SUI
} as const;

// Time constants
export const TIME = {
  SECONDS_PER_MONTH: 30 * 24 * 60 * 60,
  SECONDS_PER_DAY: 24 * 60 * 60,
  SECONDS_PER_HOUR: 60 * 60,
} as const;

// Gas budget (in MIST)
export const GAS_BUDGET = 200_000_000n; // 0.2 SUI

// Sui system objects
export const SYSTEM_OBJECTS = {
  CLOCK: "0x6", // Sui Clock object
} as const;

// UI constants
export const UI = {
  MAX_PUBLICATION_NAME_LENGTH: 100,
  MIN_PUBLICATION_NAME_LENGTH: 3,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_ARTICLE_TITLE_LENGTH: 200,
  MIN_ARTICLE_TITLE_LENGTH: 1,
  MAX_EXCERPT_LENGTH: 300,
} as const;
