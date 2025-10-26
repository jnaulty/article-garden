/**
 * Hook for purchasing and renewing subscriptions
 */

import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { MODULES, SYSTEM_OBJECTS } from "../config/constants";
import { buildTarget } from "../utils/sui";
import { Tier } from "../types";

/**
 * Hook to purchase a new subscription to a publication
 */
export function usePurchaseSubscription() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const treasuryId = useNetworkVariable("treasuryId");

  const purchaseSubscription = async (
    publicationId: string,
    tier: Tier,
    paymentAmount: bigint
  ) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    const tx = new Transaction();

    // Split coins for payment
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)]);

    // Construct Tier enum via Move call
    const tierFunctionMap: Record<Tier, string> = {
      [Tier.Free]: 'create_tier_free',
      [Tier.Basic]: 'create_tier_basic',
      [Tier.Premium]: 'create_tier_premium',
    };

    const tierArg = tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, tierFunctionMap[tier]),
      arguments: [],
    });

    // Call subscribe function
    // Note: We're not using analytics per user request
    const subscription = tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, "subscribe"),
      arguments: [
        tx.object(publicationId),
        tx.object(treasuryId),
        tierArg,
        payment,
        tx.object(SYSTEM_OBJECTS.CLOCK),
      ],
    });

    // Transfer subscription NFT to sender
    tx.transferObjects([subscription], account.address);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { purchaseSubscription };
}

/**
 * Hook to renew an existing subscription
 */
export function useRenewSubscription() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const treasuryId = useNetworkVariable("treasuryId");

  const renewSubscription = async (
    subscriptionId: string,
    publicationId: string,
    paymentAmount: bigint
  ) => {
    const tx = new Transaction();

    // Split coins for payment
    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentAmount)]);

    // Call renew function
    tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, "renew"),
      arguments: [
        tx.object(subscriptionId),
        tx.object(publicationId),
        tx.object(treasuryId),
        payment,
        tx.object(SYSTEM_OBJECTS.CLOCK),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { renewSubscription };
}
