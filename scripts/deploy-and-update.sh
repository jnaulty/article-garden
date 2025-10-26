#!/bin/bash

# Deploy and Update Script
# This script builds, tests, publishes the Move package to testnet, and updates dApp configs

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Get the project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOVE_DIR="$PROJECT_ROOT/move"
DAPP_DIR="$PROJECT_ROOT/private-publishing-dapp"
DEPLOY_OUTPUT="$MOVE_DIR/.deploy_output.json"

log_info "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Build the Move package
log_info "Step 1/5: Building Move package..."
cd "$MOVE_DIR"
if sui move build; then
    log_success "Move package built successfully"
else
    log_error "Move build failed"
    exit 1
fi
echo ""

# Step 2: Run Move tests
log_info "Step 2/5: Running Move tests..."
if sui move test; then
    log_success "Move tests passed"
else
    log_error "Move tests failed"
    exit 1
fi
echo ""

# Step 3: Publish to testnet
log_info "Step 3/5: Publishing to testnet..."
log_warning "This will consume gas from your active address"

# Run publish with JSON output
PUBLISH_JSON=$(sui client publish --gas-budget 500000000 --json)
PUBLISH_EXIT_CODE=$?

if [ $PUBLISH_EXIT_CODE -ne 0 ]; then
    log_error "Publish failed"
    echo "$PUBLISH_JSON"
    exit 1
fi

log_success "Package published to testnet"
echo ""

# Step 4: Extract package ID and treasury ID from publish output
log_info "Step 4/5: Extracting deployment information..."

# Extract Package ID from JSON output
PACKAGE_ID=$(echo "$PUBLISH_JSON" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" = "null" ]; then
    log_error "Could not extract Package ID from publish output"
    echo "$PUBLISH_JSON"
    exit 1
fi

log_success "Package ID: $PACKAGE_ID"

# Extract Treasury ID from created objects
TREASURY_ID=$(echo "$PUBLISH_JSON" | jq -r '.objectChanges[] | select(.objectType != null and (.objectType | contains("::treasury::Treasury"))) | .objectId' | head -1)

if [ -z "$TREASURY_ID" ] || [ "$TREASURY_ID" = "null" ]; then
    log_warning "Could not extract Treasury ID (this is OK if your package doesn't create one)"
    TREASURY_ID="0x0"
else
    log_success "Treasury ID: $TREASURY_ID"
fi

# Save deployment output to JSON file
cat > "$DEPLOY_OUTPUT" <<EOF
{
  "packageId": "$PACKAGE_ID",
  "treasuryId": "$TREASURY_ID",
  "network": "testnet",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "fullOutput": $PUBLISH_JSON
}
EOF

log_success "Deployment info saved to .deploy_output.json"
echo ""

# Step 5: Update dApp configuration
log_info "Step 5/5: Updating dApp configuration..."

NETWORK_CONFIG="$DAPP_DIR/src/networkConfig.ts"

if [ ! -f "$NETWORK_CONFIG" ]; then
    log_error "Network config file not found: $NETWORK_CONFIG"
    exit 1
fi

# Create backup
cp "$NETWORK_CONFIG" "$NETWORK_CONFIG.bak"
log_info "Created backup: networkConfig.ts.bak"

# Update the packageId and treasuryId in the testnet section
# Using perl for in-place editing with better regex support
perl -i -pe "
    if (/testnet:/) {
        \$in_testnet = 1;
    }
    if (\$in_testnet && /packageId:/) {
        s/packageId: \"[^\"]*\"/packageId: \"$PACKAGE_ID\"/;
    }
    if (\$in_testnet && /treasuryId:/) {
        s/treasuryId: \"[^\"]*\"/treasuryId: \"$TREASURY_ID\"/;
    }
    if (\$in_testnet && /^\s*}\s*,?\s*\$/ && !/variables/) {
        \$in_testnet = 0;
    }
" "$NETWORK_CONFIG"

log_success "Updated networkConfig.ts with new package and treasury IDs"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
log_success "Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Package ID:  $PACKAGE_ID"
echo "Treasury ID: $TREASURY_ID"
echo "Network:     testnet"
echo ""
echo "Next steps:"
echo "  1. Test the dApp to ensure it works with the new package"
echo "  2. Commit the updated networkConfig.ts if everything works"
echo "  3. Deployment details saved in: $DEPLOY_OUTPUT"
echo ""
echo "To revert the config changes, restore from backup:"
echo "  cp $NETWORK_CONFIG.bak $NETWORK_CONFIG"
echo ""
