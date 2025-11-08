import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    localnet: {
      url: "http://localhost:9000",
      variables: {
        packageId: "0x0", // Will be updated after deployment
        treasuryId: "0x0", // Will be updated after deployment
        sealKeyServers: [] as string[], // No Seal servers for localnet
      }
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: "0x0",
        treasuryId: "0x0",
        sealKeyServers: [] as string[], // Add devnet servers when available
      }
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: "0x41f5e97994f1f15479821e68e8018b2c52b32a07aea2df59a9db1141690fd88f",
        treasuryId: "0xc97daeff8a72b4f0bed8f66c3c19779d78d6eedbfe3e58774a1495701f863a22",
        // Mysten Labs Open Mode Key Servers (Testnet)
        sealKeyServers: [
          "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", // mysten-testnet-1
          "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", // mysten-testnet-2
        ],
      }
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: "0x0",
        treasuryId: "0x0",
        sealKeyServers: [] as string[], // Add mainnet servers when needed
      }
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
