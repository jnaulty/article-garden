import { Card, Flex, Heading, Text, Badge, Button } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { Publication } from "../../types";
import { mistToSui } from "../../utils/sui";

interface PublicationCardProps {
  publication: Publication;
  showActions?: boolean;
}

export function PublicationCard({ publication, showActions = true }: PublicationCardProps) {
  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Heading size="5">{publication.name}</Heading>
          {publication.free_tier_enabled && (
            <Badge color="green" variant="soft">Free Tier</Badge>
          )}
        </Flex>

        <Text size="2" color="gray" style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {publication.description}
        </Text>

        <Flex gap="2" wrap="wrap">
          <Badge variant="outline">
            Basic: {mistToSui(publication.basic_price)} SUI/mo
          </Badge>
          <Badge variant="outline">
            Premium: {mistToSui(publication.premium_price)} SUI/mo
          </Badge>
          <Badge variant="outline" color="gray">
            {publication.article_count} articles
          </Badge>
        </Flex>

        {showActions && (
          <Flex gap="2" mt="2">
            <Link to={`/publications/${publication.id}`} style={{ flex: 1, textDecoration: "none" }}>
              <Button style={{ width: "100%" }} variant="soft">
                View Details
              </Button>
            </Link>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
