/**
 * Custom hooks for publication-related operations
 */

import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { MODULES } from "../config/constants";
import { buildTarget } from "../utils/sui";

/**
 * Hook to create a new publication
 */
export function useCreatePublication() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  const createPublication = async (
    name: string,
    description: string,
    basicPrice: bigint,
    premiumPrice: bigint,
    freeTierEnabled: boolean
  ) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    const tx = new Transaction();

    // Call create_publication function
    // Note: Publication is now automatically shared, only PublisherCap is returned
    const publisherCap = tx.moveCall({
      target: buildTarget(packageId, MODULES.PUBLICATION, "create_publication"),
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.u64(basicPrice),
        tx.pure.u64(premiumPrice),
        tx.pure.bool(freeTierEnabled),
      ],
    });

    // Transfer only PublisherCap to sender (Publication is shared)
    tx.transferObjects([publisherCap], account.address);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { createPublication };
}

/**
 * Hook to update publication pricing
 */
export function useUpdatePricing() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  const updatePricing = async (
    publicationId: string,
    publisherCapId: string,
    newBasicPrice: bigint,
    newPremiumPrice: bigint
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: buildTarget(packageId, MODULES.PUBLICATION, "update_pricing"),
      arguments: [
        tx.object(publicationId),
        tx.object(publisherCapId),
        tx.pure.u64(newBasicPrice),
        tx.pure.u64(newPremiumPrice),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { updatePricing };
}

/**
 * Hook to toggle free tier availability
 */
export function useToggleFreeTier() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  const toggleFreeTier = async (
    publicationId: string,
    publisherCapId: string,
    enabled: boolean
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: buildTarget(packageId, MODULES.PUBLICATION, "toggle_free_tier"),
      arguments: [
        tx.object(publicationId),
        tx.object(publisherCapId),
        tx.pure.bool(enabled),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { toggleFreeTier };
}
