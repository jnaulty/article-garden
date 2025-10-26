/**
 * Custom hooks for subscription-related operations
 */

import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { MODULES, SYSTEM_OBJECTS } from "../config/constants";
import { buildTarget } from "../utils/sui";
import { Tier } from "../types";

/**
 * Hook to subscribe to a publication
 */
export function useSubscribe() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");

  const subscribe = async (
    publicationId: string,
    statsId: string,
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
    // Note: SubscriptionNFT remains owned by subscriber
    const subscription = tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, "subscribe"),
      arguments: [
        tx.object(publicationId),
        tx.object(statsId),
        tierArg,
        payment,
        tx.object(SYSTEM_OBJECTS.CLOCK),
      ],
    });

    // Transfer subscription to sender
    tx.transferObjects([subscription], account.address);

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { subscribe };
}

/**
 * Hook to renew an existing subscription
 */
export function useRenewSubscription() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  const renew = async (
    subscriptionId: string,
    publicationId: string,
    statsId: string,
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
        tx.object(statsId),
        payment,
        tx.object(SYSTEM_OBJECTS.CLOCK),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { renew };
}

/**
 * Hook to place subscription in Kiosk
 */
export function usePlaceInKiosk() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  const placeInKiosk = async (
    kioskId: string,
    kioskCapId: string,
    subscriptionId: string
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, "place_in_kiosk"),
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.object(subscriptionId),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { placeInKiosk };
}

/**
 * Hook to list subscription for sale in Kiosk
 */
export function useListSubscriptionForSale() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  const listForSale = async (
    kioskId: string,
    kioskCapId: string,
    subscriptionId: string,
    price: bigint
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: buildTarget(packageId, MODULES.SUBSCRIPTION, "list_for_sale"),
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.object(subscriptionId),
        tx.pure.u64(price),
      ],
    });

    const result = await signAndExecute({
      transaction: tx,
    });

    return result;
  };

  return { listForSale };
}
