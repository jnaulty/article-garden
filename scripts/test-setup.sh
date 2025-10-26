#!/bin/bash

# Test Setup Script for Private Publishing Platform
# This script validates that the development environment is properly configured

set -e

echo "🧪 Testing Private Publishing Platform Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Test function
test_command() {
    local name=$1
    local command=$2
    local required=$3

    printf "Testing %-30s" "$name..."

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ FAIL (required)${NC}"
            ((FAILED++))
            return 1
        else
            echo -e "${YELLOW}⚠ SKIP (optional)${NC}"
            return 0
        fi
    fi
}

echo "=== System Requirements ==="
test_command "Node.js (18+)" "node --version | grep -E 'v(1[8-9]|[2-9][0-9])'" "required"
test_command "npm" "npm --version" "required"
test_command "Sui CLI" "sui --version" "required"
test_command "Git" "git --version" "required"
test_command "Docker" "docker --version" "optional"
test_command "Docker Compose" "docker-compose --version" "optional"
echo ""

echo "=== Project Structure ==="
test_command "Move directory" "[ -d './move' ]" "required"
test_command "Frontend directory" "[ -d './private-publishing-dapp' ]" "required"
test_command "Move.toml" "[ -f './move/Move.toml' ]" "required"
test_command "Frontend package.json" "[ -f './private-publishing-dapp/package.json' ]" "required"
echo ""

echo "=== Move Package ==="
cd move
test_command "Move build" "sui move build" "required"
test_command "Move test" "sui move test 2>&1 | grep -i 'success\|pass'" "optional"
cd ..
echo ""

echo "=== Frontend Dependencies ==="
cd private-publishing-dapp
test_command "node_modules exists" "[ -d './node_modules' ]" "required"
test_command "TypeScript compilation" "npm run build" "required"
cd ..
echo ""

echo "=== Network Connectivity ==="
test_command "Internet connection" "ping -c 1 google.com" "optional"
test_command "Sui RPC (if running)" "curl -s http://localhost:9000 -o /dev/null" "optional"
test_command "Faucet (if running)" "curl -s http://localhost:9123 -o /dev/null" "optional"
echo ""

echo "=== Summary ==="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All required tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start Sui network: sui start --with-faucet"
    echo "2. Deploy contracts: cd move && sui client publish --gas-budget 500000000"
    echo "3. Start frontend: cd private-publishing-dapp && npm run dev"
    exit 0
else
    echo -e "${RED}✗ Some required tests failed. Please fix the issues above.${NC}"
    exit 1
fi
