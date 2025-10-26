#!/bin/bash

# Script to test subscription creation and management
# Usage: ./scripts/03_test_subscription.sh
# Prerequisites: Publication must be created (./scripts/02_test_publication.sh)

set -e

echo "=================================================="
echo "Testing Subscription Module"
echo "=================================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found. Please run deployment and publication tests first."
    exit 1
fi

source .env.local

if [ -z "$PUBLICATION_ID" ]; then
    echo "Error: PUBLICATION_ID not found. Please run ./scripts/02_test_publication.sh first."
    exit 1
fi

echo "Using Package ID: $PACKAGE_ID"
echo "Publication ID: $PUBLICATION_ID"
echo ""

# Get a gas coin for payment
echo "Getting gas coin for subscription payment..."
GAS_COIN=$(sui client gas --json | jq -r '.[0].gasCoinId')
echo "Using gas coin: $GAS_COIN"
echo ""

# Test 1: Subscribe with Free tier
echo "=================================================="
echo "Test 1: Subscribing with Free tier"
echo "=================================================="
echo ""

# Split a coin with 0 value for free tier
SPLIT_OUTPUT=$(sui client split-coin \
    --coin-id $GAS_COIN \
    --amounts 0 \
    --gas-budget 10000000 \
    --json)

FREE_COIN=$(echo "$SPLIT_OUTPUT" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

echo "Created zero-value coin: $FREE_COIN"
echo ""

# Get clock object (shared object at 0x6)
CLOCK="0x6"

SUBSCRIBE_FREE=$(sui client call \
    --package $PACKAGE_ID \
    --module subscription \
    --function subscribe \
    --args \
        $PUBLICATION_ID \
        "0" \
        $FREE_COIN \
        $CLOCK \
    --gas-budget 100000000 \
    --json)

FREE_SUBSCRIPTION_ID=$(echo "$SUBSCRIBE_FREE" | jq -r '.objectChanges[] | select(.objectType | contains("SubscriptionNFT")) | .objectId')

echo "✅ Free subscription created!"
echo "  Subscription ID: $FREE_SUBSCRIPTION_ID"
echo ""

# View subscription details
echo "Subscription details:"
sui client object $FREE_SUBSCRIPTION_ID --json | jq '.data.content.fields | {tier, expires_at, subscriber}'
echo ""

# Test 2: Subscribe with Basic tier
echo "=================================================="
echo "Test 2: Subscribing with Basic tier (5 SUI)"
echo "=================================================="
echo ""

# Split coin for basic payment (5 SUI = 5000000000 MIST)
SPLIT_BASIC=$(sui client split-coin \
    --coin-id $GAS_COIN \
    --amounts 5000000000 \
    --gas-budget 10000000 \
    --json)

BASIC_COIN=$(echo "$SPLIT_BASIC" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

SUBSCRIBE_BASIC=$(sui client call \
    --package $PACKAGE_ID \
    --module subscription \
    --function subscribe \
    --args \
        $PUBLICATION_ID \
        "1" \
        $BASIC_COIN \
        $CLOCK \
    --gas-budget 100000000 \
    --json)

BASIC_SUBSCRIPTION_ID=$(echo "$SUBSCRIBE_BASIC" | jq -r '.objectChanges[] | select(.objectType | contains("SubscriptionNFT")) | .objectId')

echo "✅ Basic subscription created!"
echo "  Subscription ID: $BASIC_SUBSCRIPTION_ID"
echo ""

# View subscription details
echo "Subscription details:"
sui client object $BASIC_SUBSCRIPTION_ID --json | jq '.data.content.fields'
echo ""

# Test 3: Subscribe with Premium tier
echo "=================================================="
echo "Test 3: Subscribing with Premium tier (15 SUI)"
echo "=================================================="
echo ""

# Request more funds for premium
sui client faucet > /dev/null 2>&1
sleep 2

# Get new gas coin
GAS_COIN2=$(sui client gas --json | jq -r '.[1].gasCoinId')

# Split coin for premium payment (15 SUI = 15000000000 MIST)
SPLIT_PREMIUM=$(sui client split-coin \
    --coin-id $GAS_COIN2 \
    --amounts 15000000000 \
    --gas-budget 10000000 \
    --json)

PREMIUM_COIN=$(echo "$SPLIT_PREMIUM" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

SUBSCRIBE_PREMIUM=$(sui client call \
    --package $PACKAGE_ID \
    --module subscription \
    --function subscribe \
    --args \
        $PUBLICATION_ID \
        "2" \
        $PREMIUM_COIN \
        $CLOCK \
    --gas-budget 100000000 \
    --json)

PREMIUM_SUBSCRIPTION_ID=$(echo "$SUBSCRIBE_PREMIUM" | jq -r '.objectChanges[] | select(.objectType | contains("SubscriptionNFT")) | .objectId')

echo "✅ Premium subscription created!"
echo "  Subscription ID: $PREMIUM_SUBSCRIPTION_ID"
echo ""

# View subscription details
echo "Subscription details:"
sui client object $PREMIUM_SUBSCRIPTION_ID --json | jq '.data.content.fields'
echo ""

# Test 4: Renew a subscription
echo "=================================================="
echo "Test 4: Renewing Basic subscription"
echo "=================================================="
echo ""

# Split coin for renewal
SPLIT_RENEW=$(sui client split-coin \
    --coin-id $GAS_COIN2 \
    --amounts 5000000000 \
    --gas-budget 10000000 \
    --json)

RENEW_COIN=$(echo "$SPLIT_RENEW" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

echo "Original expiry:"
ORIGINAL_EXPIRY=$(sui client object $BASIC_SUBSCRIPTION_ID --json | jq -r '.data.content.fields.expires_at')
echo "  $ORIGINAL_EXPIRY"
echo ""

RENEW_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module subscription \
    --function renew \
    --args \
        $BASIC_SUBSCRIPTION_ID \
        $PUBLICATION_ID \
        $RENEW_COIN \
        $CLOCK \
    --gas-budget 100000000 \
    --json)

echo "✅ Subscription renewed!"
echo ""

NEW_EXPIRY=$(sui client object $BASIC_SUBSCRIPTION_ID --json | jq -r '.data.content.fields.expires_at')
echo "New expiry: $NEW_EXPIRY"
echo ""

# Save subscription IDs for other tests
cat >> .env.local << EOF

# Subscription Test Results
FREE_SUBSCRIPTION_ID=$FREE_SUBSCRIPTION_ID
BASIC_SUBSCRIPTION_ID=$BASIC_SUBSCRIPTION_ID
PREMIUM_SUBSCRIPTION_ID=$PREMIUM_SUBSCRIPTION_ID
EOF

# Summary
echo "=================================================="
echo "Subscription Module Test Summary"
echo "=================================================="
echo ""
echo "✅ All tests passed!"
echo ""
echo "Created subscriptions:"
echo "  - Free Tier: $FREE_SUBSCRIPTION_ID"
echo "  - Basic Tier: $BASIC_SUBSCRIPTION_ID"
echo "  - Premium Tier: $PREMIUM_SUBSCRIPTION_ID"
echo ""
echo "Next steps:"
echo "  - Run ./scripts/04_test_article.sh to test article publishing"
echo "  - Run ./scripts/05_test_analytics.sh to test analytics"
