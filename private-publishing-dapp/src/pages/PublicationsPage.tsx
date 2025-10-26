import { useState } from "react";
import { Container, Heading, Grid, Flex, TextField, Spinner, Callout, Text, Badge, Select } from "@radix-ui/themes";
import { MagnifyingGlassIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { usePublications } from "../hooks/usePublicationQueries";
import { PublicationCard } from "../components/Publication/PublicationCard";

export function PublicationsPage() {
  const { data: publications, isLoading, error } = usePublications();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "paid">("all");

  // Filter publications based on search and tier filter
  const filteredPublications = publications?.filter((pub) => {
    // Search filter
    const matchesSearch =
      pub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pub.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Tier filter
    const matchesTier =
      tierFilter === "all" ||
      (tierFilter === "free" && pub.free_tier_enabled) ||
      (tierFilter === "paid" && !pub.free_tier_enabled);

    return matchesSearch && matchesTier;
  });

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="2">
          <Heading size="8">Browse Publications</Heading>
          <Text color="gray" size="3">
            Discover and subscribe to publications on the Sui blockchain
          </Text>
        </Flex>

        {/* Search and Filters */}
        <Flex gap="3" wrap="wrap">
          <TextField.Root
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "250px" }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>
          </TextField.Root>

          <Select.Root value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
            <Select.Trigger placeholder="Filter by tier" style={{ minWidth: "150px" }} />
            <Select.Content>
              <Select.Item value="all">All Publications</Select.Item>
              <Select.Item value="free">Free Tier Available</Select.Item>
              <Select.Item value="paid">Paid Only</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Loading State */}
        {isLoading && (
          <Flex justify="center" align="center" py="9">
            <Spinner size="3" />
          </Flex>
        )}

        {/* Error State */}
        {error && (
          <Callout.Root color="red">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Failed to load publications: {error.message}
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Empty State - No Publications */}
        {!isLoading && !error && publications && publications.length === 0 && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              No publications found. Be the first to create one!
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Empty State - No Results */}
        {!isLoading && !error && filteredPublications && filteredPublications.length === 0 && publications && publications.length > 0 && (
          <Callout.Root>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              No publications match your search or filter criteria.
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Publications Grid */}
        {!isLoading && !error && filteredPublications && filteredPublications.length > 0 && (
          <>
            <Flex justify="between" align="center">
              <Text color="gray" size="2">
                Showing {filteredPublications.length} publication{filteredPublications.length !== 1 ? "s" : ""}
              </Text>
              {searchQuery && (
                <Badge color="gray" variant="soft">
                  Filtered
                </Badge>
              )}
            </Flex>

            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
              {filteredPublications.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </Grid>
          </>
        )}
      </Flex>
    </Container>
  );
}
