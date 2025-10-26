import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <Box
      px="4"
      py="3"
      style={{
        borderBottom: "1px solid var(--gray-a2)",
        backgroundColor: "var(--color-background)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: "56px",
      }}
    >
      <Container size="4">
        <Flex justify="between" align="center">
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Heading size="6">📚 Private Publishing</Heading>
          </Link>

          {/* Wallet Connect Button */}
          <Box>
            <ConnectButton />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
