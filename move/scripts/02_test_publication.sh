#!/bin/bash

# Script to test publication creation and management
# Usage: ./scripts/02_test_publication.sh
# Prerequisites: Package must be deployed (./scripts/01_deploy.sh)

set -e

echo "=================================================="
echo "Testing Publication Module"
echo "=================================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found. Please run ./scripts/01_deploy.sh first."
    exit 1
fi

source .env.local

echo "Using Package ID: $PACKAGE_ID"
echo "Active Address: $ACTIVE_ADDRESS"
echo ""

# Test 1: Create a publication
echo "=================================================="
echo "Test 1: Creating a publication"
echo "=================================================="
echo ""

CREATE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module publication \
    --function create_publication \
    --args \
        "Test Publication" \
        "A test publication for demonstrating the private publishing platform" \
        "5000000000" \
        "15000000000" \
        "true" \
    --gas-budget 100000000 \
    --json)

echo "$CREATE_OUTPUT" | jq '.'

# Extract created objects
PUBLICATION_ID=$(echo "$CREATE_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Publication")) | .objectId')
PUBLISHER_CAP_ID=$(echo "$CREATE_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("PublisherCap")) | .objectId')

echo ""
echo "✅ Publication created!"
echo "  Publication ID: $PUBLICATION_ID"
echo "  PublisherCap ID: $PUBLISHER_CAP_ID"
echo ""

# Save for other scripts
cat >> .env.local << EOF

# Publication Test Results
PUBLICATION_ID=$PUBLICATION_ID
PUBLISHER_CAP_ID=$PUBLISHER_CAP_ID
EOF

# Test 2: View publication details
echo "=================================================="
echo "Test 2: Viewing publication details"
echo "=================================================="
echo ""

sui client object $PUBLICATION_ID --json | jq '.data.content.fields'
echo ""

# Test 3: Update pricing
echo "=================================================="
echo "Test 3: Updating publication pricing"
echo "=================================================="
echo ""

UPDATE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module publication \
    --function update_pricing \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "10000000000" \
        "20000000000" \
    --gas-budget 100000000 \
    --json)

echo "$UPDATE_OUTPUT" | jq '.effects'
echo ""
echo "✅ Pricing updated!"
echo ""

# Verify update
echo "Updated publication details:"
sui client object $PUBLICATION_ID --json | jq '.data.content.fields | {name, basic_price, premium_price}'
echo ""

# Test 4: Toggle free tier
echo "=================================================="
echo "Test 4: Toggling free tier"
echo "=================================================="
echo ""

TOGGLE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module publication \
    --function toggle_free_tier \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "false" \
    --gas-budget 100000000 \
    --json)

echo "$TOGGLE_OUTPUT" | jq '.effects'
echo ""
echo "✅ Free tier toggled!"
echo ""

# Verify toggle
echo "Updated free tier status:"
sui client object $PUBLICATION_ID --json | jq '.data.content.fields.free_tier_enabled'
echo ""

# Test 5: Toggle back
echo "Toggling free tier back to enabled..."
sui client call \
    --package $PACKAGE_ID \
    --module publication \
    --function toggle_free_tier \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "true" \
    --gas-budget 100000000 > /dev/null 2>&1

echo "✅ Free tier re-enabled!"
echo ""

# Summary
echo "=================================================="
echo "Publication Module Test Summary"
echo "=================================================="
echo ""
echo "✅ All tests passed!"
echo ""
echo "Created objects:"
echo "  - Publication: $PUBLICATION_ID"
echo "  - PublisherCap: $PUBLISHER_CAP_ID"
echo ""
echo "Next steps:"
echo "  - Run ./scripts/03_test_subscription.sh to test subscriptions"
echo "  - Run ./scripts/04_test_article.sh to test articles"
echo "  - Run ./scripts/05_test_analytics.sh to test analytics"
