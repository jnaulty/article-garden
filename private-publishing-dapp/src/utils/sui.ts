/**
 * Sui blockchain utility functions
 */

// Convert MIST to SUI for display
export function mistToSui(mist: bigint | string): string {
  const mistBigInt = typeof mist === "string" ? BigInt(mist) : mist;
  const sui = Number(mistBigInt) / 1_000_000_000;
  return sui.toFixed(2);
}

// Convert SUI to MIST for transactions
export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * 1_000_000_000));
}

// Format timestamp to readable date
export function formatTimestamp(timestamp: string | number): string {
  const timestampNum = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = new Date(timestampNum * 1000); // Convert seconds to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format timestamp to readable date and time
export function formatTimestampFull(timestamp: string | number): string {
  const timestampNum = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = new Date(timestampNum * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Check if subscription is expired
export function isSubscriptionExpired(expiresAt: string | number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtNum = typeof expiresAt === "string" ? Number(expiresAt) : expiresAt;
  return expiresAtNum <= now;
}

// Calculate days remaining
export function daysRemaining(expiresAt: string | number): number {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtNum = typeof expiresAt === "string" ? Number(expiresAt) : expiresAt;
  const remaining = expiresAtNum - now;
  return Math.max(0, Math.floor(remaining / (24 * 60 * 60)));
}

// Calculate hours remaining
export function hoursRemaining(expiresAt: string | number): number {
  const now = Math.floor(Date.now() / 1000);
  const expiresAtNum = typeof expiresAt === "string" ? Number(expiresAt) : expiresAt;
  const remaining = expiresAtNum - now;
  return Math.max(0, Math.floor(remaining / (60 * 60)));
}

// Get tier display name
export function getTierName(tier: number): string {
  // Handle undefined/null/non-number inputs
  if (tier === undefined || tier === null || typeof tier !== 'number') {
    console.warn('[getTierName] Invalid tier value:', tier, 'Type:', typeof tier);
    return "Unknown";
  }

  switch (tier) {
    case 0:
      return "Free";
    case 1:
      return "Basic";
    case 2:
      return "Premium";
    default:
      console.warn('[getTierName] Unexpected tier value:', tier);
      return "Unknown";
  }
}

// Get tier badge color for Radix UI
export function getTierColor(tier: number): "gray" | "blue" | "purple" {
  switch (tier) {
    case 0:
      return "gray";
    case 1:
      return "blue";
    case 2:
      return "purple";
    default:
      return "gray";
  }
}

// Build function target for Move calls
export function buildTarget(
  packageId: string,
  module: string,
  functionName: string
): `${string}::${string}::${string}` {
  return `${packageId}::${module}::${functionName}`;
}

// Shorten address for display (0x1234...5678)
export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 2) {
    return address;
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format large numbers with commas
export function formatNumber(num: number | string): string {
  const numValue = typeof num === "string" ? parseFloat(num) : num;
  return numValue.toLocaleString("en-US");
}

// Calculate percentage
export function calculatePercentage(part: number, total: number): string {
  if (total === 0) return "0";
  return ((part / total) * 100).toFixed(1);
}
