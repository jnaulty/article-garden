#!/bin/bash

# Master script to run all tests in sequence
# Usage: ./scripts/run_all_tests.sh
# Prerequisites: Local Sui network must be running

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  Private Publishing Platform - Full Test Suite ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

START_TIME=$(date +%s)

# Clean up previous test results
if [ -f .env.local ]; then
    echo "Cleaning up previous test results..."
    rm .env.local
    echo ""
fi

# Check if local network is accessible
echo "Checking local network connection..."
if ! curl -s http://127.0.0.1:9000 > /dev/null 2>&1; then
    echo "❌ Error: Local Sui network not accessible at http://127.0.0.1:9000"
    echo ""
    echo "Please start the local network first:"
    echo "  ./scripts/00_setup_local_network.sh"
    echo ""
    echo "Then in another terminal, run this script again."
    exit 1
fi

echo "✅ Local network is running"
echo ""

# Ensure we're on local environment
sui client switch --env local > /dev/null 2>&1 || {
    echo "Creating local environment..."
    sui client new-env --alias local --rpc http://127.0.0.1:9000
    sui client switch --env local
}

echo "╔════════════════════════════════════════════════╗"
echo "║  Step 1/6: Deploying Package                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/01_deploy.sh

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Step 2/6: Testing Publications               ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/02_test_publication.sh

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Step 3/6: Testing Subscriptions              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/03_test_subscription.sh

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Step 4/6: Testing Articles                   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/04_test_article.sh

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Step 5/6: Testing Analytics                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/05_test_analytics.sh

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║  Step 6/6: Testing Access Control             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
./scripts/06_test_access_control.sh

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║           🎉 ALL TESTS PASSED! 🎉              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Test Duration: ${MINUTES}m ${SECONDS}s"
echo ""
echo "Test Results Summary:"
echo "═══════════════════════════════════════════════════"
echo ""

# Load final results
source .env.local

echo "Deployed Package:"
echo "  Package ID: $PACKAGE_ID"
echo "  Publisher:  $PUBLISHER_ID"
echo ""

echo "Created Objects:"
echo "  Publication:         $PUBLICATION_ID"
echo "  PublisherCap:        $PUBLISHER_CAP_ID"
echo "  Analytics Stats:     $STATS_ID"
echo ""

echo "Subscriptions:"
echo "  Free Tier:           $FREE_SUBSCRIPTION_ID"
echo "  Basic Tier:          $BASIC_SUBSCRIPTION_ID"
echo "  Premium Tier:        $PREMIUM_SUBSCRIPTION_ID"
echo ""

echo "Articles:"
echo "  Free Article:        $ARTICLE_FREE_ID"
echo "  Basic Article:       $ARTICLE_BASIC_ID"
echo "  Premium Article:     $ARTICLE_PREMIUM_ID"
echo ""

echo "Access Tokens:"
echo "  Read Token (Basic):  $READ_TOKEN_ID"
if [ ! -z "$FREE_TOKEN_ID" ]; then
echo "  Read Token (Free):   $FREE_TOKEN_ID"
fi
echo ""

echo "═══════════════════════════════════════════════════"
echo ""
echo "Module Coverage:"
echo "  ✅ Publication    - Create, update pricing, toggle free tier"
echo "  ✅ Subscription   - Free/Basic/Premium tiers, renewal"
echo "  ✅ Article        - Publish, update, archive/unarchive"
echo "  ✅ Analytics      - Track subscribers, revenue, views"
echo "  ✅ Access Control - Read tokens, subscription verification"
echo "  ✅ Events         - Emitted for all major operations"
echo ""

echo "Next Steps:"
echo "  - View objects in Sui Explorer (local)"
echo "  - Check transaction effects with: sui client tx <digest>"
echo "  - Query events with: sui client events --query <filter>"
echo "  - Extend tests with custom scenarios"
echo ""
echo "Test results saved to: .env.local"
