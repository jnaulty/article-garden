import { useState } from "react";
import { Card, Flex, TextField, TextArea, Button, Text, Checkbox } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../../networkConfig";
import { usePublisherLayout, usePublisherPreferences } from "../../contexts/PublisherThemeContext";
import { MODULES } from "../../config/constants";
import { suiToMist } from "../../utils/sui";
import {
  validatePublicationName,
  validateDescription,
  validatePricing
} from "../../utils/validation";
import { logger } from "../../utils/logger";

interface CreatePublicationFormProps {
  onSuccess?: (publicationId: string) => void;
}

export function CreatePublicationForm({ onSuccess }: CreatePublicationFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basicPrice, setBasicPrice] = useState("5");
  const [premiumPrice, setPremiumPrice] = useState("15");
  const [freeTierEnabled, setFreeTierEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");

  // Publisher theme
  const layout = usePublisherLayout();
  const preferences = usePublisherPreferences();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const nameError = validatePublicationName(name);
    const descError = validateDescription(description);
    const pricingError = validatePricing(Number(basicPrice), Number(premiumPrice));

    if (nameError || descError || pricingError) {
      setError(nameError || descError || pricingError);
      return;
    }

    try {
      setLoading(true);

      const tx = new Transaction();

      // Call create_publication
      // Note: Publication is now automatically shared, only PublisherCap is returned
      const publisherCap = tx.moveCall({
        target: `${packageId}::${MODULES.PUBLICATION}::create_publication`,
        arguments: [
          tx.pure.string(name),
          tx.pure.string(description),
          tx.pure.u64(suiToMist(Number(basicPrice))),
          tx.pure.u64(suiToMist(Number(premiumPrice))),
          tx.pure.bool(freeTierEnabled),
        ],
      });

      // Transfer only PublisherCap to sender (Publication is shared)
      if (!account?.address) {
        throw new Error("No active wallet address");
      }

      tx.transferObjects([publisherCap], tx.pure.address(account.address));

      const result = await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (txResult) => {
            logger.info({
              context: 'CreatePublicationForm',
              operation: 'create_publication',
              digest: txResult.digest,
              name
            }, 'Transaction successful');
          },
        }
      );

      // Reset form on success
      setName("");
      setDescription("");
      setBasicPrice("5");
      setPremiumPrice("15");
      setFreeTierEnabled(true);

      // Call success callback with transaction digest
      if (onSuccess) {
        // For now, pass the digest as the publication ID
        // In a real app, you'd query the transaction to get the actual object ID
        onSuccess(result.digest);
      }

    } catch (err: any) {
      logger.error({
        context: 'CreatePublicationForm',
        operation: 'create_publication',
        error: err,
        name
      }, 'Create publication error');
      setError(err.message || "Failed to create publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ padding: `var(--space-${layout.cardPadding})` }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap={layout.cardGap}>
          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">Publication Name</Text>
            <TextField.Root
              placeholder="My Amazing Publication"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {preferences.showFormHelpers && (
              <Text size="1" color="gray">Choose a unique name for your publication</Text>
            )}
          </Flex>

          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">Description</Text>
            <TextArea
              placeholder="Describe what readers will get from subscribing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
            {preferences.showFormHelpers && (
              <Text size="1" color="gray">Explain the value subscribers will receive</Text>
            )}
          </Flex>

          <Flex gap="3">
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Text size="2" weight="medium">Basic Price (SUI/month)</Text>
              <TextField.Root
                type="number"
                placeholder="5"
                value={basicPrice}
                onChange={(e) => setBasicPrice(e.target.value)}
                required
                min="0"
                step="0.1"
              />
              {preferences.showFormHelpers && (
                <Text size="1" color="gray">Basic tier pricing</Text>
              )}
            </Flex>
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Text size="2" weight="medium">Premium Price (SUI/month)</Text>
              <TextField.Root
                type="number"
                placeholder="15"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(e.target.value)}
                required
                min="0"
                step="0.1"
              />
              {preferences.showFormHelpers && (
                <Text size="1" color="gray">Premium tier pricing</Text>
              )}
            </Flex>
          </Flex>

          <Flex align="center" gap="2">
            <Checkbox
              checked={freeTierEnabled}
              onCheckedChange={(checked) => setFreeTierEnabled(checked === true)}
            />
            <Text size="2">Enable Free Tier</Text>
          </Flex>

          {error && (
            <Card style={{ backgroundColor: "var(--red-a3)" }}>
              <Text color="red" size="2">{error}</Text>
            </Card>
          )}

          <Button type="submit" disabled={loading} size="3">
            {loading ? "Creating..." : "Create Publication"}
          </Button>
        </Flex>
      </form>
    </Card>
  );
}
