#!/bin/bash

# Script to setup and start a local Sui network for testing
# Usage: ./scripts/00_setup_local_network.sh

set -e

echo "=================================================="
echo "Setting Up Local Sui Network"
echo "=================================================="
echo ""

# Check if sui is installed
if ! command -v sui &> /dev/null; then
    echo "Error: 'sui' command not found. Please install Sui CLI first."
    echo "Visit: https://docs.sui.io/guides/developer/getting-started/sui-install"
    exit 1
fi

echo "Sui CLI version:"
sui --version
echo ""

# Setup local environment
echo "Setting up local network environment..."
sui client new-env --alias local --rpc http://127.0.0.1:9000 || echo "Local environment already exists"
sui client switch --env local
echo ""

echo "Active environment:"
sui client active-env
echo ""

echo "Active address:"
sui client active-address || echo "No active address yet"
echo ""

echo "=================================================="
echo "Starting Local Sui Network"
echo "=================================================="
echo ""
echo "This will start the network with:"
echo "  - Faucet for test coins"
echo "  - Force regenesis (fresh state)"
echo ""
echo "Starting network... (Press Ctrl+C to stop)"
echo ""
echo "In another terminal, run:"
echo "  cd $(pwd)"
echo "  source scripts/00_setup_local_network.sh  # to set env"
echo "  ./scripts/01_deploy.sh                    # to deploy package"
echo ""
echo "=================================================="
echo ""

# Start the network
RUST_LOG="off,sui_node=info" sui start --with-faucet --force-regenesis
