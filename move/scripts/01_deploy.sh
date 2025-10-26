#!/bin/bash

# Script to deploy the private_publishing package to local Sui network
# Usage: ./scripts/01_deploy.sh
# Prerequisites: Local network must be running (./scripts/00_setup_local_network.sh)

set -e

echo "=================================================="
echo "Deploying Private Publishing Platform"
echo "=================================================="
echo ""

# Check if sui client is configured
if ! sui client active-address &> /dev/null; then
    echo "Error: Sui client not configured. Please run 'sui client' first."
    exit 1
fi

# Ensure we're on local network
CURRENT_ENV=$(sui client active-env)
if [ "$CURRENT_ENV" != "local" ]; then
    echo "Warning: Not on local environment. Current: $CURRENT_ENV"
    echo "Switching to local..."
    sui client switch --env local
fi

ACTIVE_ADDRESS=$(sui client active-address)
echo "Active address: $ACTIVE_ADDRESS"
echo "Network: $(sui client active-env)"
echo ""

# Request test coins from faucet
echo "Requesting test SUI from faucet..."
sui client faucet
echo ""

# Wait a moment for faucet
sleep 2

# Check gas balance
echo "Current gas objects:"
sui client gas
echo ""

# Build the package
echo "Building Move package..."
sui move build
echo ""

# Deploy the package
echo "Publishing package..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 200000000 --json)

if [ $? -ne 0 ]; then
    echo "Error: Failed to publish package"
    exit 1
fi

echo "$PUBLISH_OUTPUT" > .deploy_output.json

# Extract important object IDs
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
PUBLISHER_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Publisher")) | .objectId')

echo "=================================================="
echo "Deployment Successful!"
echo "=================================================="
echo "Package ID: $PACKAGE_ID"
echo "Publisher ID: $PUBLISHER_ID"
echo ""

# Save to environment file
cat > .env.local << EOF
# Private Publishing Platform - Deployment Info
# Generated on $(date)

PACKAGE_ID=$PACKAGE_ID
PUBLISHER_ID=$PUBLISHER_ID
ACTIVE_ADDRESS=$ACTIVE_ADDRESS
EOF

echo "Environment variables saved to .env.local"
echo ""
echo "To use in other scripts:"
echo "  source .env.local"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/02_test_publication.sh to test publication creation"
echo "  2. Run ./scripts/03_test_subscription.sh to test subscriptions"
echo "  3. Run ./scripts/04_test_article.sh to test article publishing"
echo "  4. Run ./scripts/run_all_tests.sh to run all tests"
