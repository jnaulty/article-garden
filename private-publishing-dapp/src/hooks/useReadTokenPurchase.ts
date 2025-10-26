/**
 * Hook for purchasing read tokens (pay-per-article access)
 */

import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { MODULES, SYSTEM_OBJECTS } from "../config/constants";
import { buildTarget } from "../utils/sui";

/**
 * Hook to purchase a 24-hour read token for a single article
 */
export function usePurchaseReadToken() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const treasuryId = useNetworkVariable("treasuryId");

  const purchaseReadToken = async (
    articleId: string,
    publicationId: string,
    paymentAmount: bigint
  ) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    const tx = new Transaction();

    // Split coins for payment
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)]);

    // Call generate_read_token function
    const readToken = tx.moveCall({
      target: buildTarget(packageId, MODULES.ACCESS_CONTROL, "generate_read_token"),
      arguments: [
        tx.object(articleId),
        tx.object(publicationId),
        tx.object(treasuryId),
        payment,
        tx.object(SYSTEM_OBJECTS.CLOCK),
      ],
    });

    // Transfer read token to sender
    tx.transferObjects([readToken], account.address);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { purchaseReadToken };
}

/**
 * Helper to calculate daily rate from monthly price
 * Used to determine read token price (monthly price / 30)
 */
export function calculateDailyRate(monthlyPriceInMist: string | bigint): bigint {
  const monthly = typeof monthlyPriceInMist === "string"
    ? BigInt(monthlyPriceInMist)
    : monthlyPriceInMist;

  return monthly / 30n;
}
