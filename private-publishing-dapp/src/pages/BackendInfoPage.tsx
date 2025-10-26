/**
 * Backend Information Page
 * Displays comprehensive information about the deployed Move package,
 * smart contracts, and network configuration for learning purposes.
 */

import { useState } from 'react';
import {
  Container,
  Heading,
  Text,
  Flex,
  Box,
  Card,
  Badge,
  Code,
  Button,
  Link
} from '@radix-ui/themes';
import {
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  InfoCircledIcon
} from '@radix-ui/react-icons';
import { useNetworkVariables } from '../networkConfig';
import { useSuiClientContext } from '@mysten/dapp-kit';

export function BackendInfoPage() {
  const { packageId, treasuryId, sealKeyServers } = useNetworkVariables();
  const { network } = useSuiClientContext();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getExplorerUrl = (id: string, type: 'object' | 'txblock' = 'object') => {
    return `https://suiscan.xyz/${network}/${type}/${id}`;
  };

  // Check if package is deployed (not default 0x0 value)
  const isDeployed = packageId !== '0x0';

  // Deployment info dynamically loaded from networkConfig
  const deploymentInfo = {
    network: network,
    packageId: packageId,
    treasuryId: treasuryId,
    isDeployed: isDeployed,
  };

  const moveModules = [
    { name: 'access_control', description: 'Publisher and role-based access control' },
    { name: 'analytics', description: 'On-chain analytics tracking for articles' },
    { name: 'article', description: 'Core article management with encryption' },
    { name: 'marketplace_policies', description: 'Transfer policies for marketplace trading' },
    { name: 'publication', description: 'Publication registry and management' },
    { name: 'seal_policy', description: 'Seal encryption policy integration' },
    { name: 'subscription', description: 'NFT-based subscription management' },
    { name: 'treasury', description: 'Platform treasury and revenue distribution' },
  ];

  const CopyableId = ({ id, label }: { id: string; label: string }) => (
    <Flex align="center" gap="2" style={{ flexWrap: 'wrap' }}>
      <Code size="2" style={{
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: 'var(--gray-3)',
        flex: '1 1 auto',
        wordBreak: 'break-all'
      }}>
        {id}
      </Code>
      <Flex gap="2">
        <Button
          size="1"
          variant="ghost"
          onClick={() => copyToClipboard(id, label)}
          style={{ cursor: 'pointer' }}
        >
          {copiedId === label ? <CheckIcon /> : <CopyIcon />}
        </Button>
        <Link href={getExplorerUrl(id)} target="_blank" rel="noopener noreferrer">
          <Button size="1" variant="ghost" style={{ cursor: 'pointer' }}>
            <ExternalLinkIcon />
          </Button>
        </Link>
      </Flex>
    </Flex>
  );

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <InfoCircledIcon width="24" height="24" />
            <Heading size="8">Backend Information</Heading>
          </Flex>
          <Text size="3" color="gray">
            Comprehensive information about the deployed Move smart contracts and network configuration.
            This page is designed for developers and learners to understand the backend architecture.
          </Text>
        </Flex>

        {/* Network Information */}
        <Card>
          <Flex direction="column" gap="4">
            <Flex align="center" gap="2">
              <Heading size="5">Network Configuration</Heading>
              <Badge color="blue" size="2">{network.toUpperCase()}</Badge>
              {!isDeployed && <Badge color="orange" size="2">NOT DEPLOYED</Badge>}
              {isDeployed && <Badge color="green" size="2">DEPLOYED</Badge>}
            </Flex>

            <Flex direction="column" gap="3">
              <Box>
                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Network</Text>
                <Text>{deploymentInfo.network}</Text>
              </Box>

              <Box>
                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Deployment Status</Text>
                <Text color={isDeployed ? 'green' : 'orange'}>
                  {isDeployed ? 'Package deployed and configured' : 'Package not yet deployed (packageId: 0x0)'}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Card>

        {/* Package Information */}
        {isDeployed && (
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">Package Deployment</Heading>

              <Box>
                <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Package ID</Text>
                <CopyableId id={deploymentInfo.packageId} label="package" />
              </Box>
            </Flex>
          </Card>
        )}

        {/* Contract Objects */}
        {isDeployed && (
          <Card>
            <Flex direction="column" gap="4">
              <Heading size="5">Contract Objects</Heading>

              <Box>
                <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                  Treasury (Shared Object)
                </Text>
                <CopyableId id={deploymentInfo.treasuryId} label="treasury" />
                <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>
                  Shared object for platform revenue distribution
                </Text>
              </Box>
            </Flex>
          </Card>
        )}

        {/* Move Modules */}
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">Move Modules</Heading>
            <Text size="2" color="gray">
              The package contains {moveModules.length} Move modules that implement the platform functionality:
            </Text>

            <Flex direction="column" gap="3">
              {moveModules.map((module) => (
                <Box key={module.name}>
                  <Flex align="center" gap="2" mb="1">
                    <Code>{module.name}</Code>
                  </Flex>
                  <Text size="2" color="gray">{module.description}</Text>
                </Box>
              ))}
            </Flex>
          </Flex>
        </Card>

        {/* Seal Configuration */}
        <Card>
          <Flex direction="column" gap="4">
            <Heading size="5">Seal Encryption Configuration</Heading>
            <Text size="2" color="gray">
              Seal key servers provide encryption/decryption services for private content.
            </Text>

            {sealKeyServers.length > 0 ? (
              <Flex direction="column" gap="3">
                {sealKeyServers.map((serverId, idx) => (
                  <Box key={serverId}>
                    <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                      Server {idx + 1}: mysten-{network}-{idx + 1}
                    </Text>
                    <CopyableId id={serverId} label={`seal-${idx}`} />
                  </Box>
                ))}
              </Flex>
            ) : (
              <Box p="4" style={{
                backgroundColor: 'var(--gray-3)',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <Text size="2" color="gray">
                  No Seal key servers configured for {network}
                </Text>
              </Box>
            )}
          </Flex>
        </Card>

        {/* Architecture Notes */}
        <Card style={{ backgroundColor: 'var(--blue-2)', borderColor: 'var(--blue-6)' }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <InfoCircledIcon />
              <Heading size="4">Architecture Overview</Heading>
            </Flex>
            <Text size="2">
              This dApp uses Sui Move smart contracts for on-chain logic and Mysten Labs' Seal protocol
              for end-to-end encryption of private content. Publications and articles are managed on-chain,
              while encrypted content is stored off-chain and only decryptable by authorized subscribers.
            </Text>
            <Text size="2">
              Subscriptions are implemented as NFTs stored in user Kiosks, enabling trading and royalty
              distribution through Sui's transfer policy framework.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
