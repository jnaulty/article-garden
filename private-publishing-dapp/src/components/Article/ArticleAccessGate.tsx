/**
 * ArticleAccessGate - controls article access based on subscription or read token
 */

import { useState } from "react";
import { Card, Flex, Heading, Text, Button, Badge, Callout, Dialog } from "@radix-ui/themes";
import { LockClosedIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import { usePurchaseReadToken, calculateDailyRate } from "../../hooks/useReadTokenPurchase";
import { mistToSui, getTierName, getTierColor } from "../../utils/sui";
import type { Article, Publication } from "../../types";
import { logger } from "../../utils/logger";

interface ArticleAccessGateProps {
  article: Article;
  publication: Publication;
  hasAccess: boolean;
  accessMethod?: "subscription" | "token";
  onAccessGranted?: () => void;
}

export function ArticleAccessGate({
  article,
  publication,
  hasAccess,
  accessMethod,
  onAccessGranted,
}: ArticleAccessGateProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { purchaseReadToken } = usePurchaseReadToken();

  // Calculate token price (daily rate based on article tier)
  const getTokenPrice = () => {
    if (article.tier === 0) return 0n; // Free tier
    const monthlyPrice = article.tier === 1
      ? publication.basic_price
      : publication.premium_price;
    return calculateDailyRate(monthlyPrice);
  };

  const tokenPrice = getTokenPrice();
  const tokenPriceSui = mistToSui(tokenPrice.toString());

  const handlePurchaseToken = async () => {
    try {
      setLoading(true);
      setError(null);

      await purchaseReadToken(article.id, publication.id, tokenPrice);

      // Close dialog and call success callback
      setDialogOpen(false);
      if (onAccessGranted) {
        onAccessGranted();
      }

      // Reload to refresh access status
      window.location.reload();
    } catch (err: any) {
      logger.error({
        context: 'ArticleAccessGate',
        operation: 'purchase_token',
        error: err,
        articleId: article.id,
        publicationId: publication.id
      }, 'Read token purchase error');
      setError(err.message || "Failed to purchase read token");
    } finally {
      setLoading(false);
    }
  };

  // User has access - show success message
  if (hasAccess) {
    return (
      <Card style={{ background: "var(--green-a2)", borderColor: "var(--green-a6)" }}>
        <Flex direction="column" gap="3" align="center">
          <Badge color="green" size="3">
            Access Granted
          </Badge>
          <Text align="center">
            You have access via {accessMethod === "subscription" ? "subscription" : "read token"}
          </Text>
        </Flex>
      </Card>
    );
  }

  // User does not have access - show options
  return (
    <Card style={{ background: "var(--amber-a2)", borderColor: "var(--amber-a6)" }}>
      <Flex direction="column" gap="4">
        <Flex align="center" gap="2">
          <LockClosedIcon width="20" height="20" />
          <Heading size="5">Article Locked</Heading>
        </Flex>

        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            This article requires{" "}
            <Badge color={getTierColor(article.tier)} size="1">
              {getTierName(article.tier)}
            </Badge>{" "}
            tier access or higher.
          </Callout.Text>
        </Callout.Root>

        <Flex direction="column" gap="2">
          <Text weight="bold">Access Options:</Text>

          {/* Option 1: Subscribe */}
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">1. Subscribe to Publication</Text>
              <Text size="2" color="gray">
                Get unlimited access to all {getTierName(article.tier)} tier articles for 30 days
              </Text>
              <Flex gap="2">
                <Text size="2">
                  {getTierName(article.tier)} Tier: {mistToSui(
                    article.tier === 1 ? publication.basic_price : publication.premium_price
                  )}{" "}
                  SUI/month
                </Text>
              </Flex>
              <Button
                size="2"
                onClick={() => navigate(`/publications/${publication.id}`)}
              >
                View Subscription Options
              </Button>
            </Flex>
          </Card>

          {/* Option 2: Buy Read Token */}
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">2. Buy 24-Hour Access</Text>
              <Text size="2" color="gray">
                Get temporary access to this article only
              </Text>
              <Flex gap="2">
                <Text size="2">Price: {tokenPriceSui} SUI (24 hours)</Text>
              </Flex>

              <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <Dialog.Trigger>
                  <Button size="2" variant="soft">
                    Purchase Read Token
                  </Button>
                </Dialog.Trigger>

                <Dialog.Content>
                  <Dialog.Title>Purchase 24-Hour Access</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    Get temporary access to "{article.title}"
                  </Dialog.Description>

                  <Flex direction="column" gap="4">
                    <Card>
                      <Flex direction="column" gap="2">
                        <Flex justify="between">
                          <Text weight="bold">Article:</Text>
                          <Text>{article.title}</Text>
                        </Flex>
                        <Flex justify="between">
                          <Text weight="bold">Price:</Text>
                          <Text>{tokenPriceSui} SUI</Text>
                        </Flex>
                        <Flex justify="between">
                          <Text weight="bold">Duration:</Text>
                          <Text>24 hours</Text>
                        </Flex>
                      </Flex>
                    </Card>

                    <Callout.Root>
                      <Callout.Icon>
                        <InfoCircledIcon />
                      </Callout.Icon>
                      <Callout.Text>
                        For better value, consider subscribing to get unlimited access to all articles.
                      </Callout.Text>
                    </Callout.Root>

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
                      <Button onClick={handlePurchaseToken} disabled={loading}>
                        {loading ? "Processing..." : "Purchase Access"}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Card>
  );
}
