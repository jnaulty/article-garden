# E2E Test Plan - Private Publishing Platform Reader Experience

## Overview
This document outlines comprehensive end-to-end test scenarios for the reader experience implementation. These tests should be implemented using your preferred E2E testing framework (e.g., Playwright, Cypress).

## Prerequisites for E2E Tests
- Sui testnet wallet with test SUI tokens
- At least one publication created on testnet
- Articles published in the test publication (Free, Basic, and Premium tiers)

---

## Test Suite 1: Publications Browse

### Test 1.1: View Publications List
**Steps:**
1. Navigate to `/publications`
2. Verify publications grid is displayed
3. Check that each publication card shows:
   - Publication name
   - Description
   - Basic and Premium pricing
   - Article count
   - "Free Tier Available" badge (if applicable)
   - "View Details" button

**Expected Results:**
- Publications load from GraphQL successfully
- All publication data is displayed correctly
- Loading spinner appears while fetching
- Empty state appears if no publications exist

### Test 1.2: Search Publications
**Steps:**
1. Navigate to `/publications`
2. Enter search term in search box
3. Verify filtered results

**Expected Results:**
- Publications are filtered by name/description
- Result count updates dynamically
- "Filtered" badge appears when search is active

### Test 1.3: Filter by Tier
**Steps:**
1. Navigate to `/publications`
2. Select "Free Tier Available" filter
3. Verify only publications with free tier are shown
4. Select "Paid Only" filter
5. Verify only paid publications are shown

**Expected Results:**
- Filtering works correctly for all options
- Publication count updates accordingly

---

## Test Suite 2: Publication Details

### Test 2.1: View Publication Detail
**Steps:**
1. Navigate to `/publications`
2. Click "View Details" on a publication
3. Verify publication detail page loads

**Expected Results:**
- Publication header shows name, description, publisher
- Statistics show article count, subscribers
- All three subscription tier cards are displayed
- Articles list shows all non-archived articles
- Article tiers are labeled correctly

### Test 2.2: View Articles Without Subscription
**Steps:**
1. Open a publication detail page
2. Verify articles are listed
3. Check that locked articles show lock icon

**Expected Results:**
- Articles above user's tier show lock icon
- "Subscribe to Read" button appears for locked articles
- Article excerpt and publication date are visible

---

## Test Suite 3: Subscription Purchase

### Test 3.1: Subscribe to Free Tier
**Prerequisites:** Connect wallet without existing subscription

**Steps:**
1. Navigate to publication detail page
2. Click "Subscribe" on Free tier card
3. Verify confirmation dialog appears
4. Click "Confirm Subscription"
5. Approve transaction in wallet
6. Wait for transaction confirmation

**Expected Results:**
- Dialog shows correct tier and "Free" price
- Transaction completes successfully
- Page reloads showing active subscription status
- Green callout shows "You have an active Free subscription"

### Test 3.2: Subscribe to Basic Tier
**Prerequisites:** Connect wallet, have sufficient SUI balance

**Steps:**
1. Navigate to publication detail page
2. Click "Subscribe" on Basic tier card
3. Verify confirmation dialog shows correct price
4. Confirm and approve transaction
5. Wait for confirmation

**Expected Results:**
- Transaction deducts correct amount of SUI
- Subscription NFT is created and transferred to user
- Active subscription status is displayed
- User can now access Basic tier articles

### Test 3.3: Subscribe to Premium Tier
**Prerequisites:** Connect wallet, have sufficient SUI balance

**Steps:**
1. Navigate to publication detail page
2. Click "Subscribe" on Premium tier card
3. Confirm transaction with correct Premium price
4. Approve in wallet

**Expected Results:**
- Premium subscription is created
- User gains access to all article tiers
- Subscription appears in "My Subscriptions" page

### Test 3.4: Cannot Subscribe to Multiple Tiers
**Prerequisites:** Already subscribed to one tier

**Steps:**
1. Try to subscribe to different tier
2. Verify other tier buttons are disabled

**Expected Results:**
- Only current tier subscription card is active
- Other tier buttons show "Subscribed to Different Tier" and are disabled

---

## Test Suite 4: Article Access

### Test 4.1: Read Article with Valid Subscription
**Prerequisites:** Active subscription at required tier

**Steps:**
1. Navigate to publication detail page
2. Click "Read Article" on accessible article
3. Verify article reader page loads
4. Check that article content can be decrypted

**Expected Results:**
- Article page loads successfully
- "Access Granted" badge is shown
- Decrypt button is available
- Content can be decrypted using Seal

### Test 4.2: Attempt to Read Locked Article
**Prerequisites:** No subscription or insufficient tier

**Steps:**
1. Navigate to article that requires higher tier
2. Verify access gate is displayed

**Expected Results:**
- Article content is not shown
- "Article Locked" message appears
- Two access options are presented:
  1. Subscribe to publication
  2. Buy 24-hour access token
- Tier requirement is clearly indicated

---

## Test Suite 5: Read Token Purchase

### Test 5.1: Purchase Read Token
**Prerequisites:** No subscription, have SUI balance, locked article

**Steps:**
1. Navigate to locked article page
2. Click "Purchase Read Token" in access gate
3. Verify price is 1/30th of monthly subscription
4. Confirm purchase
5. Approve transaction

**Expected Results:**
- Transaction deducts correct daily rate amount
- ReadToken NFT is created and transferred
- Page reloads showing granted access
- Article reader becomes available
- Access expires after 24 hours

### Test 5.2: Read Token Expiration
**Prerequisites:** Read token purchased and 24+ hours elapsed

**Steps:**
1. Wait 24 hours after token purchase
2. Navigate to article page
3. Verify access is revoked

**Expected Results:**
- Access gate reappears
- "Expired" status is shown
- User must purchase new token or subscribe

---

## Test Suite 6: My Subscriptions Management

### Test 6.1: View Active Subscriptions
**Prerequisites:** At least one active subscription

**Steps:**
1. Navigate to `/subscriptions`
2. Verify subscription cards are displayed
3. Check "Active" tab

**Expected Results:**
- All active subscriptions are listed
- Each card shows:
  - Publication name
  - Tier badge
  - Subscription and expiration dates
  - Days remaining (color-coded)
  - "View Publication" button
  - "Renew" button

### Test 6.2: Filter by Subscription Status
**Steps:**
1. Navigate to `/subscriptions`
2. Click "Active" tab
3. Verify only active subscriptions shown
4. Click "Expired" tab
5. Verify only expired subscriptions shown

**Expected Results:**
- Tab badges show correct counts
- Filtering works correctly
- Empty state appears if no subscriptions in category

### Test 6.3: Renew Subscription
**Prerequisites:** Subscription (can be active or expired), have SUI balance

**Steps:**
1. Navigate to `/subscriptions`
2. Click "Renew" on a subscription
3. Verify renewal dialog shows correct info
4. Confirm renewal
5. Approve transaction

**Expected Results:**
- Dialog shows +30 days extension
- Transaction completes successfully
- Expiration date extends by 30 days
- Days remaining counter updates
- If expired, status changes to "Active"

### Test 6.4: Subscription Expiration Warning
**Prerequisites:** Subscription with < 7 days remaining

**Steps:**
1. Navigate to `/subscriptions`
2. View subscription card

**Expected Results:**
- "Expiring Soon" badge is displayed (orange)
- Days remaining shows in orange color
- Renewal prompt is emphasized

---

## Test Suite 7: Complete Reader Journey

### Test 7.1: New Reader Full Journey
**Prerequisites:** Fresh wallet with test SUI, no prior subscriptions

**Steps:**
1. Connect wallet
2. Browse publications at `/publications`
3. Search for a specific publication
4. Click "View Details"
5. Review tier options and articles
6. Subscribe to Basic tier
7. Navigate to Basic tier article
8. Decrypt and read article
9. Attempt to access Premium article (should be locked)
10. Purchase read token for Premium article
11. Read Premium article with token
12. Navigate to `/subscriptions`
13. Verify both subscription and token access
14. Renew subscription before expiration
15. After 24 hours, verify token expired but subscription still active

**Expected Results:**
- All steps complete without errors
- GraphQL queries load data correctly
- Transactions execute successfully
- Access control works as expected
- UI reflects correct state at each step

---

## Test Suite 8: Error Handling

### Test 8.1: Insufficient Balance
**Prerequisites:** Wallet with insufficient SUI

**Steps:**
1. Attempt to subscribe to paid tier
2. Approve transaction

**Expected Results:**
- Transaction fails with clear error message
- User remains on same page
- No partial state changes

### Test 8.2: Network Errors
**Steps:**
1. Disconnect network
2. Navigate to publications page

**Expected Results:**
- Error message displayed
- Retry option available
- No app crash

### Test 8.3: Wallet Disconnection
**Prerequisites:** Mid-transaction

**Steps:**
1. Start subscription purchase
2. Disconnect wallet before approval

**Expected Results:**
- Transaction is cancelled
- Clear error message
- App returns to safe state

---

## Test Suite 9: GraphQL Integration

### Test 9.1: Publications Query
**Steps:**
1. Open browser developer tools
2. Navigate to `/publications`
3. Monitor network requests

**Expected Results:**
- GraphQL query sent to `https://graphql.testnet.sui.io`
- Query filters by package ID
- Response contains Publication objects with correct structure
- Data is cached for 30 seconds (staleTime)

### Test 9.2: Subscriptions Query
**Steps:**
1. Connect wallet
2. Navigate to `/subscriptions`
3. Monitor GraphQL requests

**Expected Results:**
- Query filters SubscriptionNFT by owner address and package ID
- Subscription and Publication data are fetched
- Related publication details are loaded via secondary queries

### Test 9.3: Access Check Query
**Steps:**
1. Navigate to article page
2. Monitor GraphQL queries

**Expected Results:**
- Article data is fetched
- User's subscriptions and read tokens are queried
- Access calculation happens client-side
- Proper error handling if queries fail

---

## Performance Benchmarks

### Load Times
- Publications page: < 2s
- Publication detail page: < 2s
- Article reader page: < 3s (including access check)
- My Subscriptions page: < 2s

### Transaction Times
- Subscription purchase: ~5-10s (testnet)
- Read token purchase: ~5-10s (testnet)
- Renewal: ~5-10s (testnet)

---

## Implementation Notes

### Setting Up E2E Tests

**Recommended: Playwright**

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create test directory
mkdir -p e2e
```

**Example Test Structure:**

```typescript
// e2e/reader-journey.spec.ts
import { test, expect } from '@playwright/test';

test('browse publications', async ({ page }) => {
  await page.goto('http://localhost:5173/publications');
  await expect(page.getByRole('heading', { name: 'Browse Publications' })).toBeVisible();
  // ... more assertions
});

test('subscribe to publication', async ({ page }) => {
  // 1. Connect wallet (may need custom Playwright extension)
  // 2. Navigate to publication
  // 3. Click subscribe
  // 4. Confirm transaction
  // 5. Verify success
});
```

### Wallet Integration in Tests

For wallet interaction, you may need:
- Custom Playwright/Cypress wallet extension
- Mock wallet for testing
- Test wallet with pre-funded test SUI

### CI/CD Integration

Tests should run on:
- Pull requests
- Main branch commits
- Nightly on testnet
- Before production deployments

---

## Success Criteria

✅ All test suites pass consistently
✅ No console errors during test runs
✅ GraphQL queries complete successfully
✅ Transactions execute on testnet
✅ Access control works correctly
✅ UI updates reflect blockchain state
✅ Error handling provides clear feedback
✅ Performance benchmarks are met

---

## Next Steps

1. **Set up Playwright** or preferred E2E framework
2. **Implement test wallet** connection helper
3. **Create test fixtures** with sample publications
4. **Write test specifications** based on this plan
5. **Run tests locally** against testnet
6. **Set up CI/CD pipeline** for automated testing
7. **Monitor test results** and fix failures
8. **Expand coverage** as new features are added

---

**Status**: Test plan complete, ready for implementation
**Last Updated**: $(date)
**Priority**: High - Required for production readiness
