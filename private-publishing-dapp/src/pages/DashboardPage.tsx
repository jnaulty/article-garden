import { Container, Heading, Text, Flex, Button, Card } from "@radix-ui/themes";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";
import { useNetworkVariable } from "../networkConfig";
import { usePublisherLayout } from "../contexts/PublisherThemeContext";
import { MODULES } from "../config/constants";

export function DashboardPage() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const layout = usePublisherLayout();

  // Query user's PublisherCaps
  const { data: publisherCaps, isLoading } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: {
        StructType: `${packageId}::${MODULES.PUBLICATION}::PublisherCap`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account?.address,
    }
  );

  if (!account) {
    return (
      <Container size="3" py="6">
        <Heading size="8" mb="4">Publisher Dashboard</Heading>
        <Card style={{ padding: `var(--space-${layout.cardPadding})` }}>
          <Text color="gray">Connect wallet to view your publications</Text>
        </Card>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container size="3" py="6">
        <Heading size="8" mb="4">Publisher Dashboard</Heading>
        <Text color="gray">Loading your publications...</Text>
      </Container>
    );
  }

  const hasPublications = publisherCaps && publisherCaps.data.length > 0;

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap={layout.cardGap}>
        <Flex justify="between" align="center">
          <Heading size="8">Publisher Dashboard</Heading>
          <Link to="/create-publication" style={{ textDecoration: "none" }}>
            <Button size="3">New Publication</Button>
          </Link>
        </Flex>

        {!hasPublications ? (
          <Card style={{ padding: `var(--space-${layout.cardPadding})` }}>
            <Flex direction="column" gap="4" align="center" py="6">
              <Text color="gray" size="3">You haven't created any publications yet</Text>
              <Link to="/create-publication" style={{ textDecoration: "none" }}>
                <Button size="3">Create Your First Publication</Button>
              </Link>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap="4">
            <Text size="3">
              You have {publisherCaps.data.length} publication{publisherCaps.data.length !== 1 ? 's' : ''}
            </Text>
            <Text color="gray" size="2">
              (Note: Publication details will be fetched once we implement the publication query)
            </Text>
          </Flex>
        )}
      </Flex>
    </Container>
  );
}
