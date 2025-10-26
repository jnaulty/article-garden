#!/bin/bash

# Script to test article publishing and management
# Usage: ./scripts/04_test_article.sh
# Prerequisites: Publication must be created (./scripts/02_test_publication.sh)

set -e

echo "=================================================="
echo "Testing Article Module"
echo "=================================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found. Please run previous tests first."
    exit 1
fi

source .env.local

if [ -z "$PUBLICATION_ID" ] || [ -z "$PUBLISHER_CAP_ID" ]; then
    echo "Error: PUBLICATION_ID or PUBLISHER_CAP_ID not found."
    echo "Please run ./scripts/02_test_publication.sh first."
    exit 1
fi

echo "Using Package ID: $PACKAGE_ID"
echo "Publication ID: $PUBLICATION_ID"
echo "PublisherCap ID: $PUBLISHER_CAP_ID"
echo ""

# Get current timestamp in seconds
TIMESTAMP=$(($(date +%s)))
echo "Using timestamp: $TIMESTAMP"
echo ""

# Test 1: Publish a Free tier article
echo "=================================================="
echo "Test 1: Publishing a Free tier article"
echo "=================================================="
echo ""

ARTICLE1_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function publish_article \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "Getting Started with Sui Move" \
        "Learn the basics of Move programming on Sui blockchain. This introductory article covers fundamental concepts..." \
        "walrus://blob_abc123def456" \
        "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]" \
        "0" \
        "$TIMESTAMP" \
    --gas-budget 100000000 \
    --json)

ARTICLE1_ID=$(echo "$ARTICLE1_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Article")) | .objectId')

echo "✅ Free article published!"
echo "  Article ID: $ARTICLE1_ID"
echo ""

# View article details
echo "Article details:"
sui client object $ARTICLE1_ID --json | jq '.data.content.fields | {title, tier, published_at, is_archived}'
echo ""

# Test 2: Publish a Basic tier article
echo "=================================================="
echo "Test 2: Publishing a Basic tier article"
echo "=================================================="
echo ""

ARTICLE2_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function publish_article \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "Advanced Move Patterns" \
        "Deep dive into advanced Move programming patterns including generics, abilities, and module design..." \
        "walrus://blob_xyz789abc012" \
        "[16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]" \
        "1" \
        "$TIMESTAMP" \
    --gas-budget 100000000 \
    --json)

ARTICLE2_ID=$(echo "$ARTICLE2_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Article")) | .objectId')

echo "✅ Basic article published!"
echo "  Article ID: $ARTICLE2_ID"
echo ""

# Test 3: Publish a Premium tier article
echo "=================================================="
echo "Test 3: Publishing a Premium tier article"
echo "=================================================="
echo ""

ARTICLE3_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function publish_article \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
        "Building Production dApps" \
        "Complete guide to building and deploying production-ready decentralized applications on Sui..." \
        "walrus://blob_premium_789" \
        "[32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17]" \
        "2" \
        "$TIMESTAMP" \
    --gas-budget 100000000 \
    --json)

ARTICLE3_ID=$(echo "$ARTICLE3_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("Article")) | .objectId')

echo "✅ Premium article published!"
echo "  Article ID: $ARTICLE3_ID"
echo ""

# Check publication article count
echo "Publication article count:"
sui client object $PUBLICATION_ID --json | jq '.data.content.fields.article_count'
echo ""

# Test 4: Update an article
echo "=================================================="
echo "Test 4: Updating article metadata"
echo "=================================================="
echo ""

UPDATE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function update_article \
    --args \
        $ARTICLE2_ID \
        $PUBLISHER_CAP_ID \
        "Advanced Move Patterns [Updated]" \
        "UPDATED: Deep dive into advanced Move programming patterns..." \
    --gas-budget 100000000 \
    --json)

echo "✅ Article updated!"
echo ""

echo "Updated article:"
sui client object $ARTICLE2_ID --json | jq '.data.content.fields | {title, excerpt}'
echo ""

# Test 5: Archive an article
echo "=================================================="
echo "Test 5: Archiving an article"
echo "=================================================="
echo ""

ARCHIVE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function archive_article \
    --args \
        $ARTICLE1_ID \
        $PUBLISHER_CAP_ID \
    --gas-budget 100000000 \
    --json)

echo "✅ Article archived!"
echo ""

echo "Article status:"
sui client object $ARTICLE1_ID --json | jq '.data.content.fields.is_archived'
echo ""

# Test 6: Unarchive an article
echo "=================================================="
echo "Test 6: Unarchiving an article"
echo "=================================================="
echo ""

UNARCHIVE_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module article \
    --function unarchive_article \
    --args \
        $ARTICLE1_ID \
        $PUBLISHER_CAP_ID \
    --gas-budget 100000000 \
    --json)

echo "✅ Article unarchived!"
echo ""

echo "Article status:"
sui client object $ARTICLE1_ID --json | jq '.data.content.fields.is_archived'
echo ""

# Save article IDs for access control tests
cat >> .env.local << EOF

# Article Test Results
ARTICLE_FREE_ID=$ARTICLE1_ID
ARTICLE_BASIC_ID=$ARTICLE2_ID
ARTICLE_PREMIUM_ID=$ARTICLE3_ID
EOF

# Summary
echo "=================================================="
echo "Article Module Test Summary"
echo "=================================================="
echo ""
echo "✅ All tests passed!"
echo ""
echo "Published articles:"
echo "  - Free Tier: $ARTICLE1_ID"
echo "  - Basic Tier: $ARTICLE2_ID"
echo "  - Premium Tier: $ARTICLE3_ID"
echo ""
echo "Total articles in publication: 3"
echo ""
echo "Next steps:"
echo "  - Run ./scripts/05_test_analytics.sh to test analytics tracking"
echo "  - Run ./scripts/06_test_access_control.sh to test access verification"
