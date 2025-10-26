#!/bin/bash

# Script to send WAL tokens to a recipient address
# Usage: ./send-wal.sh [recipient_address]
# If no address is provided, uses default web wallet address

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default recipient address (web wallet)
DEFAULT_RECIPIENT="0x652a9c2199ec35e9358f663595ba9ef38b6a297111e6f8045eb496c1a117dfa1"
RECIPIENT="${1:-$DEFAULT_RECIPIENT}"

# Gas budget for transfer
GAS_BUDGET=10000000

echo -e "${BLUE}=== WAL Token Transfer Script ===${NC}\n"

# Check if sui client is available
if ! command -v sui &> /dev/null; then
    echo -e "${RED}Error: sui client not found. Please install Sui CLI first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Recipient: ${RECIPIENT}${NC}\n"

# Find all WAL token objects
echo -e "${BLUE}Finding WAL tokens in your wallet...${NC}"
WAL_OBJECTS=$(sui client objects --json | jq -r '.[] | select(.data.type | contains("::wal::WAL")) | .data.objectId')

if [ -z "$WAL_OBJECTS" ]; then
    echo -e "${RED}No WAL tokens found in your wallet.${NC}"
    echo -e "${YELLOW}Run 'walrus get-wal' to get some WAL tokens.${NC}"
    exit 1
fi

# Count WAL objects
WAL_COUNT=$(echo "$WAL_OBJECTS" | wc -l | tr -d ' ')
echo -e "${GREEN}Found ${WAL_COUNT} WAL token(s)${NC}\n"

# Show details of each WAL token
echo -e "${BLUE}WAL Token Details:${NC}"
sui client objects --json | jq -r '.[] | select(.data.type | contains("::wal::WAL")) |
    "  Object ID: \(.data.objectId)\n  Balance: \(.data.content.fields.balance) (raw units)\n  Type: \(.data.type)\n"'

# Ask for confirmation
echo -e "${YELLOW}Transfer all WAL tokens to ${RECIPIENT}?${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Transfer cancelled.${NC}"
    exit 0
fi

# Transfer each WAL token
TRANSFER_COUNT=0
SUCCESS_COUNT=0
FAILED_COUNT=0

echo -e "\n${BLUE}Starting transfers...${NC}\n"

while IFS= read -r OBJECT_ID; do
    TRANSFER_COUNT=$((TRANSFER_COUNT + 1))
    echo -e "${YELLOW}[${TRANSFER_COUNT}/${WAL_COUNT}] Transferring ${OBJECT_ID}...${NC}"

    if sui client transfer \
        --object-id "$OBJECT_ID" \
        --to "$RECIPIENT" \
        --gas-budget "$GAS_BUDGET" 2>&1; then
        echo -e "${GREEN}✓ Transfer successful!${NC}\n"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗ Transfer failed!${NC}\n"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
done <<< "$WAL_OBJECTS"

# Summary
echo -e "${BLUE}=== Transfer Summary ===${NC}"
echo -e "Total WAL tokens: ${WAL_COUNT}"
echo -e "${GREEN}Successful: ${SUCCESS_COUNT}${NC}"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${RED}Failed: ${FAILED_COUNT}${NC}"
fi

if [ $SUCCESS_COUNT -eq $WAL_COUNT ]; then
    echo -e "\n${GREEN}All transfers completed successfully! 🎉${NC}"
else
    echo -e "\n${YELLOW}Some transfers failed. Check the output above for details.${NC}"
fi
