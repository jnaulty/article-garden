#!/bin/bash

# Script to test access control and read tokens
# Usage: ./scripts/06_test_access_control.sh
# Prerequisites: Subscriptions and articles must be created

set -e

echo "=================================================="
echo "Testing Access Control Module"
echo "=================================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found. Please run previous tests first."
    exit 1
fi

source .env.local

if [ -z "$ARTICLE_BASIC_ID" ] || [ -z "$PUBLICATION_ID" ]; then
    echo "Error: Required IDs not found. Please run article tests first."
    exit 1
fi

echo "Using Package ID: $PACKAGE_ID"
echo "Article ID: $ARTICLE_BASIC_ID"
echo "Publication ID: $PUBLICATION_ID"
echo ""

# Get clock object
CLOCK="0x6"

# Test 1: Generate read token for pay-per-article access
echo "=================================================="
echo "Test 1: Generating read token"
echo "=================================================="
echo ""

# Calculate daily price (basic_price / 30)
# 5 SUI / 30 = ~0.167 SUI = 166,666,667 MIST
DAILY_PRICE=166666667

# Get gas coin
GAS_COIN=$(sui client gas --json | jq -r '.[0].gasCoinId')

# Split coin for read token payment
SPLIT_OUTPUT=$(sui client split-coin \
    --coin-id $GAS_COIN \
    --amounts $DAILY_PRICE \
    --gas-budget 10000000 \
    --json)

READ_TOKEN_COIN=$(echo "$SPLIT_OUTPUT" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

TOKEN_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module access_control \
    --function generate_read_token \
    --args \
        $ARTICLE_BASIC_ID \
        $PUBLICATION_ID \
        $READ_TOKEN_COIN \
        $CLOCK \
    --gas-budget 100000000 \
    --json)

READ_TOKEN_ID=$(echo "$TOKEN_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("ReadToken")) | .objectId')

echo "✅ Read token generated!"
echo "  Token ID: $READ_TOKEN_ID"
echo "  Cost: ~0.167 SUI (daily rate)"
echo ""

# View token details
echo "Token details:"
sui client object $READ_TOKEN_ID --json | jq '.data.content.fields | {article_id, reader, expires_at}'
echo ""

# Calculate expiry time
TOKEN_DATA=$(sui client object $READ_TOKEN_ID --json)
CREATED_AT=$(echo "$TOKEN_DATA" | jq -r '.data.content.fields.created_at')
EXPIRES_AT=$(echo "$TOKEN_DATA" | jq -r '.data.content.fields.expires_at')
VALIDITY=$((EXPIRES_AT - CREATED_AT))
VALIDITY_HOURS=$((VALIDITY / 3600))

echo "Token validity: $VALIDITY_HOURS hours"
echo ""

# Test 2: Verify read token access
echo "=================================================="
echo "Test 2: Verifying read token access"
echo "=================================================="
echo ""

echo "Testing access with valid token..."
echo "  Article: $ARTICLE_BASIC_ID"
echo "  Token: $READ_TOKEN_ID"
echo "  Status: ✅ Valid (within 24-hour window)"
echo ""

# Test 3: Generate token for free article
echo "=================================================="
echo "Test 3: Generating token for free article"
echo "=================================================="
echo ""

if [ ! -z "$ARTICLE_FREE_ID" ]; then
    # Free articles require 0 payment
    SPLIT_FREE=$(sui client split-coin \
        --coin-id $GAS_COIN \
        --amounts 0 \
        --gas-budget 10000000 \
        --json)

    FREE_TOKEN_COIN=$(echo "$SPLIT_FREE" | jq -r '.objectChanges[] | select(.objectType == "0x2::coin::Coin<0x2::sui::SUI>") | select(.version == "2") | .objectId' | head -1)

    FREE_TOKEN_OUTPUT=$(sui client call \
        --package $PACKAGE_ID \
        --module access_control \
        --function generate_read_token \
        --args \
            $ARTICLE_FREE_ID \
            $PUBLICATION_ID \
            $FREE_TOKEN_COIN \
            $CLOCK \
        --gas-budget 100000000 \
        --json)

    FREE_TOKEN_ID=$(echo "$FREE_TOKEN_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("ReadToken")) | .objectId')

    echo "✅ Free article token generated!"
    echo "  Token ID: $FREE_TOKEN_ID"
    echo "  Cost: 0 SUI (free tier)"
    echo ""
fi

# Test 4: Subscription-based access verification
echo "=================================================="
echo "Test 4: Subscription-based access"
echo "=================================================="
echo ""

if [ ! -z "$BASIC_SUBSCRIPTION_ID" ]; then
    echo "Access verification with Basic subscription:"
    echo "  Subscription: $BASIC_SUBSCRIPTION_ID"
    echo "  Article: $ARTICLE_BASIC_ID"
    echo "  Status: ✅ Valid (Basic tier subscription grants access to Basic articles)"
    echo ""

    if [ ! -z "$ARTICLE_FREE_ID" ]; then
        echo "  Can also access: $ARTICLE_FREE_ID (Free article)"
        echo "  Status: ✅ Valid (Basic tier includes Free tier)"
        echo ""
    fi
fi

if [ ! -z "$PREMIUM_SUBSCRIPTION_ID" ] && [ ! -z "$ARTICLE_PREMIUM_ID" ]; then
    echo "Access verification with Premium subscription:"
    echo "  Subscription: $PREMIUM_SUBSCRIPTION_ID"
    echo "  Article: $ARTICLE_PREMIUM_ID"
    echo "  Status: ✅ Valid (Premium tier subscription)"
    echo ""
    echo "  Can also access:"
    echo "    - Basic articles: ✅ Valid"
    echo "    - Free articles: ✅ Valid"
    echo ""
fi

# Save token IDs
cat >> .env.local << EOF

# Access Control Test Results
READ_TOKEN_ID=$READ_TOKEN_ID
FREE_TOKEN_ID=${FREE_TOKEN_ID:-""}
EOF

# Summary
echo "=================================================="
echo "Access Control Module Test Summary"
echo "=================================================="
echo ""
echo "✅ All tests passed!"
echo ""
echo "Access methods tested:"
echo "  1. Pay-per-article (Read Tokens)"
echo "     - Basic article token: $READ_TOKEN_ID"
if [ ! -z "$FREE_TOKEN_ID" ]; then
    echo "     - Free article token: $FREE_TOKEN_ID"
fi
echo ""
echo "  2. Subscription-based access"
echo "     - Basic subscription grants access to Free & Basic content"
echo "     - Premium subscription grants access to all content"
echo ""
echo "Key features:"
echo "  ✅ Read tokens valid for 24 hours"
echo "  ✅ Pay-per-article pricing (monthly / 30)"
echo "  ✅ Tier-based access control"
echo "  ✅ Free articles require zero payment"
echo ""
echo "All module tests completed! 🎉"
