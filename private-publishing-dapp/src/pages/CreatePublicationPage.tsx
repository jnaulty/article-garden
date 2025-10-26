import { Container, Heading, Text, Flex, Card } from "@radix-ui/themes";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import { CreatePublicationForm } from "../components/Publication/CreatePublicationForm";
import { logger } from "../utils/logger";

export function CreatePublicationPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  if (!account) {
    return (
      <Container py="6">
        <Heading size="8" mb="4">Create Publication</Heading>
        <Card>
          <Text color="gray">Please connect your wallet to create a publication.</Text>
        </Card>
      </Container>
    );
  }

  const handleSuccess = (publicationId: string) => {
    logger.info({
      context: 'CreatePublicationPage',
      operation: 'publication_created',
      publicationId
    }, 'Publication created');
    // Navigate to dashboard after successful creation
    navigate("/dashboard");
  };

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="4">
        <Heading size="8">Create New Publication</Heading>
        <Text color="gray">
          Set up your publication with subscription tiers and start publishing encrypted content.
        </Text>
        <CreatePublicationForm onSuccess={handleSuccess} />
      </Flex>
    </Container>
  );
}
