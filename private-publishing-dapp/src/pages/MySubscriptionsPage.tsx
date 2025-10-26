import { useState } from "react";
import { Container, Heading, Text, Flex, Grid, Spinner, Callout, Tabs, Badge } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useUserSubscriptionsWithPublications, useActiveSubscriptions, useExpiredSubscriptions } from "../hooks/useSubscriptionQueries";
import { SubscriptionCard } from "../components/Subscription/SubscriptionCard";

export function MySubscriptionsPage() {
  const account = useCurrentAccount();
  const { data: allSubscriptions, isLoading, error } = useUserSubscriptionsWithPublications();
  const { data: activeSubscriptions } = useActiveSubscriptions();
  const { data: expiredSubscriptions } = useExpiredSubscriptions();
  const [activeTab, setActiveTab] = useState("all");

  if (!account) {
    return (
      <Container py="6">
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Please connect your wallet to view your subscriptions
          </Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Container py="6">
        <Flex justify="center" align="center" style={{ minHeight: "400px" }}>
          <Spinner size="3" />
        </Flex>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container py="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Failed to load subscriptions: {error.message}
          </Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  // Get subscriptions based on active tab
  const getSubscriptionsToDisplay = () => {
    switch (activeTab) {
      case "active":
        return allSubscriptions?.filter((sub) =>
          activeSubscriptions.some((active) => active.id === sub.id)
        ) || [];
      case "expired":
        return allSubscriptions?.filter((sub) =>
          expiredSubscriptions.some((expired) => expired.id === sub.id)
        ) || [];
      default:
        return allSubscriptions || [];
    }
  };

  const subscriptionsToDisplay = getSubscriptionsToDisplay();

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="2">
          <Heading size="8">My Subscriptions</Heading>
          <Text color="gray" size="3">
            Manage your active and expired subscriptions
          </Text>
        </Flex>

        {/* Empty State - No Subscriptions */}
        {allSubscriptions && allSubscriptions.length === 0 && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              You don't have any subscriptions yet. Browse publications to get started!
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Subscriptions List */}
        {allSubscriptions && allSubscriptions.length > 0 && (
          <>
            {/* Stats */}
            <Flex gap="4" wrap="wrap">
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  Total Subscriptions
                </Text>
                <Text size="5" weight="bold">
                  {allSubscriptions.length}
                </Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  Active
                </Text>
                <Text size="5" weight="bold" color="green">
                  {activeSubscriptions.length}
                </Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">
                  Expired
                </Text>
                <Text size="5" weight="bold" color="red">
                  {expiredSubscriptions.length}
                </Text>
              </Flex>
            </Flex>

            {/* Tabs for filtering */}
            <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Trigger value="all">
                  All
                  <Badge size="1" ml="2" variant="soft">
                    {allSubscriptions.length}
                  </Badge>
                </Tabs.Trigger>
                <Tabs.Trigger value="active">
                  Active
                  <Badge size="1" ml="2" variant="soft" color="green">
                    {activeSubscriptions.length}
                  </Badge>
                </Tabs.Trigger>
                <Tabs.Trigger value="expired">
                  Expired
                  <Badge size="1" ml="2" variant="soft" color="red">
                    {expiredSubscriptions.length}
                  </Badge>
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            {/* Subscriptions Grid */}
            {subscriptionsToDisplay.length === 0 ? (
              <Callout.Root>
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  No {activeTab} subscriptions found.
                </Callout.Text>
              </Callout.Root>
            ) : (
              <Grid columns={{ initial: "1", sm: "2" }} gap="4">
                {subscriptionsToDisplay.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onRenew={() => {
                      // Reload to refresh data
                      window.location.reload();
                    }}
                  />
                ))}
              </Grid>
            )}
          </>
        )}
      </Flex>
    </Container>
  );
}
