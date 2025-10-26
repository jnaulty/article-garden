import { Container, Heading, Text, Flex, Card, Badge, Grid, Spinner, Callout, Button, Separator } from "@radix-ui/themes";
import { useParams, useNavigate } from "react-router-dom";
import { InfoCircledIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { usePublication, usePublicationArticles, usePublicationStats } from "../hooks/usePublicationQueries";
import { useSubscriptionStatus } from "../hooks/useSubscriptionQueries";
import { SubscribeTierCard } from "../components/Subscription/SubscribeTierCard";
import { mistToSui, shortenAddress, formatTimestamp, getTierName, getTierColor } from "../utils/sui";
import { Tier } from "../types";

export function PublicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: publication, isLoading: pubLoading, error: pubError } = usePublication(id);
  const { data: articles, isLoading: articlesLoading } = usePublicationArticles(id);
  const { data: stats } = usePublicationStats(id);
  const { data: userSubscription, isSubscribed } = useSubscriptionStatus(id);

  const isLoading = pubLoading || articlesLoading;

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
  if (pubError || !publication) {
    return (
      <Container py="6">
        <Callout.Root color="red">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            {pubError?.message || "Publication not found"}
          </Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  const userTier = userSubscription?.tier ?? null;
  const nonArchivedArticles = articles?.filter(a => !a.is_archived) || [];

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Publication Header */}
        <Card>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="start" wrap="wrap" gap="3">
              <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Heading size="8">{publication.name}</Heading>
                <Text color="gray" size="3">{publication.description}</Text>
              </Flex>
              {publication.free_tier_enabled && (
                <Badge color="green" size="2">Free Tier Available</Badge>
              )}
            </Flex>

            <Separator size="4" />

            <Grid columns={{ initial: "1", sm: "3" }} gap="4">
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Publisher</Text>
                <Text size="2" weight="bold">{shortenAddress(publication.creator)}</Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Articles</Text>
                <Text size="2" weight="bold">{nonArchivedArticles.length}</Text>
              </Flex>
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Total Subscribers</Text>
                <Text size="2" weight="bold">{stats?.total_subscribers || "0"}</Text>
              </Flex>
            </Grid>
          </Flex>
        </Card>

        {/* Subscription Status */}
        {isSubscribed && userSubscription && (
          <Callout.Root color="green">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              You have an active {getTierName(userSubscription.tier)} subscription
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Subscription Tiers */}
        <Flex direction="column" gap="3">
          <Heading size="6">Subscription Tiers</Heading>
          <Grid columns={{ initial: "1", sm: "3" }} gap="4">
            {publication.free_tier_enabled && (
              <SubscribeTierCard
                publicationId={publication.id}
                tier={Tier.Free}
                price="0"
                isCurrentTier={userTier === Tier.Free}
                isActive={isSubscribed}
                onSuccess={() => window.location.reload()}
              />
            )}
            <SubscribeTierCard
              publicationId={publication.id}
              tier={Tier.Basic}
              price={publication.basic_price}
              isCurrentTier={userTier === Tier.Basic}
              isActive={isSubscribed}
              onSuccess={() => window.location.reload()}
            />
            <SubscribeTierCard
              publicationId={publication.id}
              tier={Tier.Premium}
              price={publication.premium_price}
              isCurrentTier={userTier === Tier.Premium}
              isActive={isSubscribed}
              onSuccess={() => window.location.reload()}
            />
          </Grid>
        </Flex>

        {/* Articles List */}
        <Flex direction="column" gap="3">
          <Heading size="6">Articles</Heading>

          {nonArchivedArticles.length === 0 ? (
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                No articles published yet.
              </Callout.Text>
            </Callout.Root>
          ) : (
            <Grid columns="1" gap="3">
              {nonArchivedArticles.map((article) => {
                const canAccess = userTier !== null && userTier >= article.tier;
                return (
                  <Card key={article.id}>
                    <Flex direction="column" gap="3">
                      <Flex justify="between" align="start" gap="3">
                        <Flex direction="column" gap="2" style={{ flex: 1 }}>
                          <Flex align="center" gap="2">
                            <Heading size="4">{article.title}</Heading>
                            <Badge color={getTierColor(article.tier)} size="1">
                              {getTierName(article.tier)}
                            </Badge>
                            {!canAccess && <LockClosedIcon />}
                          </Flex>
                          <Text size="2" color="gray">{article.excerpt}</Text>
                          <Text size="1" color="gray">
                            Published {formatTimestamp(article.published_at)}
                          </Text>
                        </Flex>
                      </Flex>

                      <Flex gap="2">
                        {canAccess ? (
                          <Button
                            size="2"
                            onClick={() => navigate(`/articles/${article.id}`)}
                          >
                            Read Article
                          </Button>
                        ) : (
                          <Button
                            size="2"
                            variant="soft"
                            onClick={() => {
                              // Scroll to subscription tiers
                              document.querySelector('[data-subscription-tiers]')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            <LockClosedIcon />
                            Subscribe to Read
                          </Button>
                        )}
                      </Flex>
                    </Flex>
                  </Card>
                );
              })}
            </Grid>
          )}
        </Flex>

        {/* About Section */}
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">About this Publication</Heading>
            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Pricing</Text>
                <Text size="2">Basic: {mistToSui(publication.basic_price)} SUI/month</Text>
                <Text size="2">Premium: {mistToSui(publication.premium_price)} SUI/month</Text>
              </Flex>
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">Statistics</Text>
                {stats && (
                  <>
                    <Text size="2">Total Views: {stats.total_views}</Text>
                    <Text size="2">Revenue: {mistToSui(stats.total_revenue)} SUI</Text>
                  </>
                )}
              </Flex>
            </Grid>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
