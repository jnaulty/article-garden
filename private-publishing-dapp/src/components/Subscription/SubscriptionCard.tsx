/**
 * SubscriptionCard - displays a user's subscription with status and actions
 */

import { useState } from "react";
import { Card, Flex, Heading, Text, Button, Badge, Dialog, Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import { useRenewSubscription } from "../../hooks/useSubscriptionPurchase";
import {
  mistToSui,
  getTierName,
  getTierColor,
  formatTimestamp,
  daysRemaining,
  isSubscriptionExpired,
} from "../../utils/sui";
import type { SubscriptionWithPublication } from "../../types";
import { logger } from "../../utils/logger";

interface SubscriptionCardProps {
  subscription: SubscriptionWithPublication;
  onRenew?: () => void;
}

export function SubscriptionCard({ subscription, onRenew }: SubscriptionCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { renewSubscription } = useRenewSubscription();

  const tierName = getTierName(subscription.tier);
  const tierColor = getTierColor(subscription.tier);
  const expired = isSubscriptionExpired(subscription.expires_at);
  const daysLeft = daysRemaining(subscription.expires_at);
  const isExpiringSoon = !expired && daysLeft <= 7;

  // Get renewal price
  const getRenewalPrice = () => {
    if (!subscription.publication) return 0n;
    if (subscription.tier === 0) return 0n; // Free tier
    return subscription.tier === 1
      ? BigInt(subscription.publication.basic_price)
      : BigInt(subscription.publication.premium_price);
  };

  const renewalPrice = getRenewalPrice();
  const renewalPriceSui = mistToSui(renewalPrice.toString());

  const handleRenew = async () => {
    if (!subscription.publication) {
      setError("Publication information not available");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await renewSubscription(
        subscription.id,
        subscription.publication.id,
        renewalPrice
      );

      // Close dialog and call success callback
      setDialogOpen(false);
      if (onRenew) {
        onRenew();
      }

      // Reload to refresh data
      window.location.reload();
    } catch (err: any) {
      logger.error({
        context: 'SubscriptionCard',
        operation: 'renew_subscription',
        error: err,
        subscriptionId: subscription.id,
        publicationId: subscription.publication?.id
      }, 'Subscription renewal error');
      setError(err.message || "Failed to renew subscription");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (expired) {
      return (
        <Badge color="red" size="2">
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge color="orange" size="2">
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge color="green" size="2">
        Active
      </Badge>
    );
  };

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="start" wrap="wrap" gap="2">
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <Heading size="4">
                {subscription.publication?.name || "Unknown Publication"}
              </Heading>
            </Flex>
            <Badge color={tierColor} size="2">
              {tierName} Tier
            </Badge>
          </Flex>
          {getStatusBadge()}
        </Flex>

        {/* Details */}
        <Flex direction="column" gap="2">
          <Flex justify="between">
            <Text size="2" color="gray">
              Subscribed:
            </Text>
            <Text size="2">{formatTimestamp(subscription.subscribed_at)}</Text>
          </Flex>
          <Flex justify="between">
            <Text size="2" color="gray">
              Expires:
            </Text>
            <Text size="2" color={expired ? "red" : undefined}>
              {formatTimestamp(subscription.expires_at)}
            </Text>
          </Flex>
          <Flex justify="between">
            <Text size="2" color="gray">
              Days Remaining:
            </Text>
            <Text size="2" weight="bold" color={expired ? "red" : isExpiringSoon ? "orange" : "green"}>
              {expired ? "0" : daysLeft}
            </Text>
          </Flex>
        </Flex>

        {/* Actions */}
        <Flex gap="2" wrap="wrap">
          <Button
            size="2"
            variant="soft"
            onClick={() => {
              if (subscription.publication) {
                navigate(`/publications/${subscription.publication.id}`);
              }
            }}
            style={{ flex: 1 }}
          >
            View Publication
          </Button>

          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger>
              <Button
                size="2"
                variant={expired || isExpiringSoon ? "solid" : "soft"}
                style={{ flex: 1 }}
              >
                Renew
              </Button>
            </Dialog.Trigger>

            <Dialog.Content>
              <Dialog.Title>Renew Subscription</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Renew your {tierName} tier subscription?
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <Card>
                  <Flex direction="column" gap="2">
                    <Flex justify="between">
                      <Text weight="bold">Publication:</Text>
                      <Text>{subscription.publication?.name || "Unknown"}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text weight="bold">Tier:</Text>
                      <Badge color={tierColor}>{tierName}</Badge>
                    </Flex>
                    <Flex justify="between">
                      <Text weight="bold">Price:</Text>
                      <Text>{renewalPriceSui} SUI</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text weight="bold">New Duration:</Text>
                      <Text>+30 days</Text>
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
                  <Button onClick={handleRenew} disabled={loading}>
                    {loading ? "Processing..." : "Confirm Renewal"}
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Flex>
    </Card>
  );
}
