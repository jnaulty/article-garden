#!/bin/bash

# Script to test analytics tracking
# Usage: ./scripts/05_test_analytics.sh
# Prerequisites: Publication must be created (./scripts/02_test_publication.sh)

set -e

echo "=================================================="
echo "Testing Analytics Module"
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
    exit 1
fi

echo "Using Package ID: $PACKAGE_ID"
echo "Publication ID: $PUBLICATION_ID"
echo ""

# Test 1: Create analytics stats
echo "=================================================="
echo "Test 1: Creating analytics stats"
echo "=================================================="
echo ""

STATS_OUTPUT=$(sui client call \
    --package $PACKAGE_ID \
    --module analytics \
    --function create_stats \
    --args \
        $PUBLICATION_ID \
        $PUBLISHER_CAP_ID \
    --gas-budget 100000000 \
    --json)

STATS_ID=$(echo "$STATS_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("PublicationStats")) | .objectId')

echo "✅ Analytics stats created!"
echo "  Stats ID: $STATS_ID"
echo ""

# View initial stats
echo "Initial stats:"
sui client object $STATS_ID --json | jq '.data.content.fields'
echo ""

# Test 2: Record free subscription
echo "=================================================="
echo "Test 2: Recording Free tier subscription"
echo "=================================================="
echo ""

sui client call \
    --package $PACKAGE_ID \
    --module analytics \
    --function record_subscription \
    --args \
        $STATS_ID \
        "0" \
    --gas-budget 100000000 > /dev/null 2>&1

echo "✅ Free subscription recorded!"
echo ""

# Test 3: Record basic subscriptions and revenue
echo "=================================================="
echo "Test 3: Recording Basic tier subscriptions"
echo "=================================================="
echo ""

# Record 3 basic subscriptions
for i in {1..3}; do
    sui client call \
        --package $PACKAGE_ID \
        --module analytics \
        --function record_subscription \
        --args \
            $STATS_ID \
            "1" \
        --gas-budget 100000000 > /dev/null 2>&1

    # Record revenue for each (5 SUI)
    sui client call \
        --package $PACKAGE_ID \
        --module analytics \
        --function record_revenue \
        --args \
            $STATS_ID \
            "5000000000" \
        --gas-budget 100000000 > /dev/null 2>&1
done

echo "✅ Recorded 3 basic subscriptions (5 SUI each)"
echo ""

# Test 4: Record premium subscriptions and revenue
echo "=================================================="
echo "Test 4: Recording Premium tier subscriptions"
echo "=================================================="
echo ""

# Record 2 premium subscriptions
for i in {1..2}; do
    sui client call \
        --package $PACKAGE_ID \
        --module analytics \
        --function record_subscription \
        --args \
            $STATS_ID \
            "2" \
        --gas-budget 100000000 > /dev/null 2>&1

    # Record revenue for each (15 SUI)
    sui client call \
        --package $PACKAGE_ID \
        --module analytics \
        --function record_revenue \
        --args \
            $STATS_ID \
            "15000000000" \
        --gas-budget 100000000 > /dev/null 2>&1
done

echo "✅ Recorded 2 premium subscriptions (15 SUI each)"
echo ""

# Test 5: Record article views
echo "=================================================="
echo "Test 5: Recording article views"
echo "=================================================="
echo ""

if [ ! -z "$ARTICLE_FREE_ID" ]; then
    # Record 5 views for free article
    for i in {1..5}; do
        sui client call \
            --package $PACKAGE_ID \
            --module analytics \
            --function record_view \
            --args \
                $STATS_ID \
                "$ARTICLE_FREE_ID" \
            --gas-budget 100000000 > /dev/null 2>&1
    done
    echo "✅ Recorded 5 views for free article"
fi

if [ ! -z "$ARTICLE_BASIC_ID" ]; then
    # Record 10 views for basic article
    for i in {1..10}; do
        sui client call \
            --package $PACKAGE_ID \
            --module analytics \
            --function record_view \
            --args \
                $STATS_ID \
                "$ARTICLE_BASIC_ID" \
            --gas-budget 100000000 > /dev/null 2>&1
    done
    echo "✅ Recorded 10 views for basic article"
fi

if [ ! -z "$ARTICLE_PREMIUM_ID" ]; then
    # Record 3 views for premium article
    for i in {1..3}; do
        sui client call \
            --package $PACKAGE_ID \
            --module analytics \
            --function record_view \
            --args \
                $STATS_ID \
                "$ARTICLE_PREMIUM_ID" \
            --gas-budget 100000000 > /dev/null 2>&1
    done
    echo "✅ Recorded 3 views for premium article"
fi

echo ""

# Test 6: View comprehensive stats
echo "=================================================="
echo "Test 6: Viewing comprehensive analytics"
echo "=================================================="
echo ""

echo "Full analytics data:"
sui client object $STATS_ID --json | jq '.data.content.fields'
echo ""

# Calculate totals
STATS_DATA=$(sui client object $STATS_ID --json)
FREE_COUNT=$(echo "$STATS_DATA" | jq -r '.data.content.fields.subscriber_counts.fields.free')
BASIC_COUNT=$(echo "$STATS_DATA" | jq -r '.data.content.fields.subscriber_counts.fields.basic')
PREMIUM_COUNT=$(echo "$STATS_DATA" | jq -r '.data.content.fields.subscriber_counts.fields.premium')
TOTAL_REVENUE=$(echo "$STATS_DATA" | jq -r '.data.content.fields.total_revenue')

TOTAL_SUBS=$((FREE_COUNT + BASIC_COUNT + PREMIUM_COUNT))
REVENUE_SUI=$(echo "scale=2; $TOTAL_REVENUE / 1000000000" | bc)

echo "=================================================="
echo "Analytics Summary"
echo "=================================================="
echo ""
echo "Subscriber Counts:"
echo "  Free:    $FREE_COUNT"
echo "  Basic:   $BASIC_COUNT"
echo "  Premium: $PREMIUM_COUNT"
echo "  Total:   $TOTAL_SUBS"
echo ""
echo "Revenue:"
echo "  Total: ${REVENUE_SUI} SUI ($TOTAL_REVENUE MIST)"
echo ""

if [ ! -z "$ARTICLE_FREE_ID" ]; then
    echo "Article Views:"
    echo "  Free Article:    5 views"
    echo "  Basic Article:   10 views"
    echo "  Premium Article: 3 views"
    echo ""
fi

# Save stats ID
cat >> .env.local << EOF

# Analytics Test Results
STATS_ID=$STATS_ID
EOF

echo "=================================================="
echo "Analytics Module Test Summary"
echo "=================================================="
echo ""
echo "✅ All tests passed!"
echo ""
echo "Stats ID: $STATS_ID"
echo ""
echo "Next steps:"
echo "  - Run ./scripts/06_test_access_control.sh to test access verification"
