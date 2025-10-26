/**
 * SubscribeTierCard - displays a subscription tier with purchase button
 */

import { useState } from "react";
import { Card, Flex, Heading, Text, Button, Badge, Dialog, Callout } from "@radix-ui/themes";
import { CheckIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { usePurchaseSubscription } from "../../hooks/useSubscriptionPurchase";
import { mistToSui, getTierName, getTierColor } from "../../utils/sui";
import { Tier } from "../../types";
import { logger } from "../../utils/logger";

interface SubscribeTierCardProps {
  publicationId: string;
  tier: Tier;
  price: string; // in MIST
  isCurrentTier?: boolean;
  isActive?: boolean; // user has an active subscription
  onSuccess?: () => void;
}

export function SubscribeTierCard({
  publicationId,
  tier,
  price,
  isCurrentTier = false,
  isActive = false,
  onSuccess,
}: SubscribeTierCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { purchaseSubscription } = usePurchaseSubscription();

  const tierName = getTierName(tier);
  const tierColor = getTierColor(tier);
  const priceInSui = mistToSui(price);
  const isFree = tier === Tier.Free;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      await purchaseSubscription(publicationId, tier, BigInt(price));

      // Close dialog and call success callback
      setDialogOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      logger.error({
        context: 'SubscribeTierCard',
        operation: 'purchase_subscription',
        error: err,
        publicationId,
        tier
      }, 'Subscription purchase error');
      setError(err.message || "Failed to purchase subscription");
    } finally {
      setLoading(false);
    }
  };

  const getTierFeatures = () => {
    switch (tier) {
      case Tier.Free:
        return [
          "Access to free articles",
          "Basic reading experience",
          "Community support",
        ];
      case Tier.Basic:
        return [
          "All Free tier features",
          "Access to Basic articles",
          "Priority support",
          "Early access to content",
        ];
      case Tier.Premium:
        return [
          "All Basic tier features",
          "Access to Premium articles",
          "Exclusive content",
          "Direct publisher access",
          "Ad-free experience",
        ];
      default:
        return [];
    }
  };

  return (
    <Card
      style={{
        borderColor: isCurrentTier ? "var(--accent-9)" : undefined,
        borderWidth: isCurrentTier ? "2px" : undefined,
      }}
    >
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="start">
          <Flex direction="column" gap="1">
            <Badge color={tierColor} size="2">
              {tierName}
            </Badge>
            {isCurrentTier && (
              <Badge color="green" variant="soft" size="1">
                Current Tier
              </Badge>
            )}
          </Flex>
          <Flex direction="column" align="end">
            <Heading size="6">{isFree ? "Free" : `${priceInSui} SUI`}</Heading>
            <Text size="1" color="gray">
              per month
            </Text>
          </Flex>
        </Flex>

        {/* Features */}
        <Flex direction="column" gap="2">
          {getTierFeatures().map((feature, idx) => (
            <Flex key={idx} gap="2" align="start">
              <CheckIcon style={{ marginTop: "2px", flexShrink: 0 }} />
              <Text size="2">{feature}</Text>
            </Flex>
          ))}
        </Flex>

        {/* Action Button */}
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Trigger>
            <Button
              size="3"
              variant={isCurrentTier ? "soft" : "solid"}
              disabled={isActive && !isCurrentTier}
              style={{ width: "100%" }}
            >
              {isCurrentTier
                ? "Current Subscription"
                : isActive
                ? "Subscribed to Different Tier"
                : isFree
                ? "Subscribe for Free"
                : "Subscribe"}
            </Button>
          </Dialog.Trigger>

          <Dialog.Content>
            <Dialog.Title>Confirm Subscription</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Subscribe to the {tierName} tier for this publication?
            </Dialog.Description>

            <Flex direction="column" gap="4">
              <Card>
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text weight="bold">Tier:</Text>
                    <Badge color={tierColor}>{tierName}</Badge>
                  </Flex>
                  <Flex justify="between">
                    <Text weight="bold">Price:</Text>
                    <Text>{isFree ? "Free" : `${priceInSui} SUI/month`}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text weight="bold">Duration:</Text>
                    <Text>30 days</Text>
                  </Flex>
                </Flex>
              </Card>

              {error && (
                <Callout.Root color="red">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              )}

              <Flex gap="3" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" disabled={loading}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button onClick={handlePurchase} disabled={loading}>
                  {loading ? "Processing..." : "Confirm Subscription"}
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Card>
  );
}
