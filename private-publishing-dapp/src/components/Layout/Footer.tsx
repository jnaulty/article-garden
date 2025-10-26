import { Box, Container, Flex, Text, Link as RadixLink } from "@radix-ui/themes";

export function Footer() {
  return (
    <Box
      py="6"
      mt="9"
      style={{
        borderTop: "1px solid var(--gray-a2)",
      }}
    >
      <Container size="4">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Text size="2" color="gray">
              Built with Sui + Seal + Walrus
            </Text>
            <Flex gap="4">
              <RadixLink href="https://docs.sui.io" target="_blank" size="2" color="gray">
                Sui Docs
              </RadixLink>
              <RadixLink href="https://github.com/MystenLabs/sui" target="_blank" size="2" color="gray">
                GitHub
              </RadixLink>
            </Flex>
          </Flex>
          <Text size="1" color="gray" align="center">
            Decentralized Privacy-First Publishing Platform
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}
