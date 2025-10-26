import { Flex, Heading, Text, Button, Container, Separator, Box } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useFeedArticles } from "../hooks/useFeedArticles";
import { ContinueReadingSection } from "../components/Reading/ContinueReadingSection";
import { ThemedArticleFeedItem } from "../components/Article/ThemedArticleFeedItem";

export function HomePage() {
  const account = useCurrentAccount();
  const { data: feedArticles } = useFeedArticles();

  // Show personalized view for logged-in users with subscriptions
  if (account && feedArticles && feedArticles.length > 0) {
    return (
      <Container size="3" py="9">
        <Flex direction="column" gap="6">
          {/* Header */}
          <Flex justify="between" align="center">
            <Box>
              <Heading size="8">Welcome back!</Heading>
              <Text size="3" color="gray">
                Here's what's new from your subscriptions
              </Text>
            </Box>
            <Link to="/feed" style={{ textDecoration: "none" }}>
              <Button variant="soft">View Full Feed →</Button>
            </Link>
          </Flex>

          {/* Continue Reading Section */}
          <ContinueReadingSection limit={3} />

          <Separator size="4" />

          {/* New This Week */}
          <Box>
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">New This Week</Heading>
              <Link to="/publications" style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="1">Browse More →</Button>
              </Link>
            </Flex>
            <Flex direction="column" gap="3">
              {feedArticles
                .filter(a => !a.is_read)
                .slice(0, 5)
                .map(article => (
                  <ThemedArticleFeedItem key={article.id} article={article} />
                ))}
            </Flex>
          </Box>
        </Flex>
      </Container>
    );
  }

  // Original landing page for non-authenticated users or users without subscriptions
  return (
    <Container py="9">
      <Flex direction="column" align="center" gap="6" style={{ textAlign: "center" }}>
        <Heading size="9">Private Publishing Platform</Heading>

        <Text size="5" color="gray" style={{ maxWidth: 600 }}>
          A decentralized, privacy-first publishing platform built on Sui.
          Create encrypted content, manage subscriptions as NFTs, and earn from your work.
        </Text>

        <Flex gap="4" mt="4">
          <Link to="/publications" style={{ textDecoration: "none" }}>
            <Button size="3">Browse Publications</Button>
          </Link>

          {account && (
            <Link to="/create-publication" style={{ textDecoration: "none" }}>
              <Button size="3" variant="soft">Create Publication</Button>
            </Link>
          )}
        </Flex>

        <Flex direction="column" gap="4" mt="9" style={{ maxWidth: 800 }}>
          <Heading size="6">Features</Heading>

          <Flex gap="6" wrap="wrap" justify="center">
            <Flex direction="column" gap="2" style={{ flex: "1 1 200px", maxWidth: 250 }}>
              <Text weight="bold">End-to-End Encryption</Text>
              <Text size="2" color="gray">
                Content encrypted with Seal, only accessible to subscribers
              </Text>
            </Flex>

            <Flex direction="column" gap="2" style={{ flex: "1 1 200px", maxWidth: 250 }}>
              <Text weight="bold">NFT Subscriptions</Text>
              <Text size="2" color="gray">
                Subscriptions are tradeable NFTs stored in your Kiosk
              </Text>
            </Flex>

            <Flex direction="column" gap="2" style={{ flex: "1 1 200px", maxWidth: 250 }}>
              <Text weight="bold">Creator Royalties</Text>
              <Text size="2" color="gray">
                Automatic royalties on subscription resales
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Container>
  );
}
