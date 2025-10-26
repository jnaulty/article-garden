# Private Publishing Platform - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Readers](#for-readers)
3. [For Publishers](#for-publishers)
4. [Wallet Setup](#wallet-setup)
5. [Platform Features](#platform-features)
6. [Troubleshooting](#troubleshooting)
7. [FAQs](#faqs)

---

## Getting Started

Welcome to the Private Publishing Platform! This decentralized application enables publishers to create and monetize content while providing readers with secure access to encrypted articles through blockchain-based subscriptions.

### Platform Overview

- **Decentralized**: Built on the Sui blockchain
- **Encrypted Content**: Articles are encrypted and stored securely
- **Flexible Subscriptions**: Choose from Free, Basic, or Premium tiers
- **Direct Payments**: Publishers receive payments directly
- **Privacy-First**: Your reading history stays private

### Quick Start

1. **Install a Sui Wallet** (see [Wallet Setup](#wallet-setup))
2. **Connect your wallet** to the platform
3. **Browse publications** or create your own
4. **Subscribe** to access content or **publish** your articles

---

## For Readers

### Browsing Publications

#### Finding Publications

1. Navigate to the **Publications** page from the main menu
2. Browse the grid of available publications
3. Use filters to narrow your search:
   - **Free Tier Available**: Shows only free publications
   - **Paid Only**: Shows premium publications
   - **Search**: Filter by name or description

![Publications Page](./images/publications-page.png)

#### Viewing Publication Details

Click on any publication card to view:

- **Publication Info**: Name, description, and publisher
- **Subscription Tiers**: Available subscription options with pricing
- **Article List**: All available articles with tier requirements
- **Statistics**: Total articles, subscribers, and engagement

### Subscribing to Publications

#### Understanding Subscription Tiers

Each publication offers up to three subscription tiers:

| Tier | Access | Typical Use |
|------|--------|-------------|
| **Free** | Basic articles only | Try before subscribing |
| **Basic** | Free + Basic articles | Regular readers |
| **Premium** | All articles | Dedicated fans |

#### How to Subscribe

1. **Choose a Publication**
   - Navigate to the publication detail page
   - Review available tiers and pricing

2. **Select Subscription Tier**
   - Click "Subscribe" on your desired tier
   - Review the subscription details:
     - **Listed Price** (in SUI)
     - **Protocol Fee**: 1% goes to platform treasury
     - **Publisher Receives**: 99% of your payment
     - Duration (30 days default)
     - Access level

   ```
   Example: Premium Tier @ 500 SUI
   ├─> You Pay: 500 SUI
   ├─> Platform Fee (1%): 5 SUI
   ├─> Publisher Gets: 495 SUI
   └─> You Get: Premium access NFT (30 days)
   ```

3. **Complete Purchase**
   - Confirm transaction details (price includes 1% fee)
   - Approve in your wallet
   - Wait for confirmation

4. **Access Your Content**
   - Your subscription NFT is automatically transferred
   - Access is immediate upon confirmation
   - View in "My Subscriptions"

#### Managing Subscriptions

Navigate to **My Subscriptions** to:

- View all active subscriptions
- Check expiration dates
- Upgrade to higher tiers
- Renew expiring subscriptions

```
Subscription Card Layout:
┌─────────────────────────┐
│ [Publication Image]     │
│ Tech Weekly            │
│ Premium Tier           │
│ Expires: Jan 30, 2025  │
│                        │
│ [Upgrade] [Renew] [Sell]│
└─────────────────────────┘
```

#### Trading Subscriptions

**Your subscriptions are NFTs** - you fully own them and can trade them on the secondary marketplace!

**Why Trade Subscriptions?**
- Sell unused time if you're no longer interested
- Buy discounted subscriptions on the secondary market
- Gift subscriptions to friends and family
- Speculate on popular publications

**How to Sell Your Subscription:**

1. **List in Marketplace**
   - Go to "My Subscriptions"
   - Click "Sell" on the subscription you want to trade
   - Set your asking price (consider remaining time)
   - Confirm the listing transaction

2. **Pricing Guide**
   ```
   Example: Premium subscription (500 SUI/month)

   Days Remaining: 20 out of 30
   Fair Price: ~333 SUI (20/30 * 500)
   Discount Price: ~300 SUI (10% off for quick sale)
   ```

3. **Transaction Costs**
   - **Listing**: Just gas fees (~0.01 SUI)
   - **Buyer pays**: Sale price + 10% royalty to publisher
   - **You receive**: Full sale price (90% of total)

**How to Buy on Secondary Market:**

1. **Browse Marketplace**
   - Navigate to "Marketplace" page
   - Filter by publication or tier
   - Sort by price, time remaining, or deal quality

2. **Evaluate Listings**
   - Check expiration date (days remaining)
   - Calculate price per day
   - Compare to primary subscription price
   - Verify publisher (10% royalty applies)

3. **Complete Purchase**
   - Click "Buy Now" on desired listing
   - Review total cost (price + 10% royalty)
   - Confirm transaction in wallet
   - Subscription transfers immediately

**Trading Example:**

```
Alice's Premium Subscription:
- Original Cost: 500 SUI (30 days)
- Days Remaining: 15 days
- Listed Price: 275 SUI
- Royalty (10%): 27.5 SUI
- Alice Receives: 275 SUI
- Bob Pays: 302.5 SUI total
- Bob Gets: 15 days of Premium access
- Bob's Rate: 20.17 SUI/day vs 16.67 SUI/day new
- Publisher Gets: 27.5 SUI royalty
```

**Pro Tips:**
- List expired subscriptions at low prices (some buyers speculate on future value)
- Buy near end of month when sellers are desperate
- Compare price-per-day ratio before buying
- Remember: Original subscriber field doesn't affect access

**Important Notes:**
- ✅ Full ownership - you control your subscription NFT
- ✅ Access preserved after transfer
- ✅ Can be traded multiple times
- ⚠️ Publishers always earn 10% royalty (fair compensation)
- ⚠️ Expired subscriptions have no access value
- ⚠️ No refunds on marketplace purchases

### Reading Articles

#### Accessing Articles

1. **From Publication Page**
   - Click on any article card
   - Articles you can access show "Read"
   - Locked articles show a lock icon

2. **Article Access States**

   | Icon | State | Action |
   |------|-------|--------|
   | ✓ | Accessible | Click to read |
   | 🔒 | Locked | Subscribe to unlock |
   | 🕒 | Loading | Decrypting content |

#### Reading Encrypted Content

When you click on an accessible article:

1. **Verification**: System verifies your subscription
2. **Decryption**: Content is fetched and decrypted
3. **Display**: Article appears in the reader

The process typically takes 2-5 seconds depending on article size.

#### Article Reader Features

- **Clean Reading View**: Distraction-free reading experience
- **Font Controls**: Adjust size and style
- **Dark Mode**: Toggle between light and dark themes
- **Bookmarking**: Save your reading position
- **Sharing**: Share article links (recipients need access)

### Purchasing Individual Articles

If you don't want a subscription, you can purchase individual article access:

1. Click on a locked article
2. Select "Purchase Article Access"
3. Pay the one-time fee (typically 1-2 SUI)
4. Receive a Read Token NFT
5. Access the article immediately

Read Tokens provide:
- Permanent access to one article
- No expiration date
- Transferable to other wallets

---

## For Publishers

### Creating a Publication

#### Prerequisites

- Sui wallet with at least 10 SUI for gas fees
- Content ready to publish
- Basic understanding of subscription tiers

#### Step-by-Step Creation

1. **Navigate to Create Publication**
   - Click "Create Publication" from dashboard
   - Or use the "+" button in the header

2. **Fill in Publication Details**

   ```
   Publication Name: [Tech Weekly]
   Description: [Your publication description]
   Image URL: [https://your-image-url.com/logo.png]

   Subscription Pricing:
   - Basic Tier: [5 SUI/month]
   - Premium Tier: [10 SUI/month]
   ```

3. **Set Pricing Strategy**

   | Tier | Recommended Price | Target Audience |
   |------|------------------|-----------------|
   | Free | 0 SUI | New readers |
   | Basic | 3-5 SUI | Regular readers |
   | Premium | 8-15 SUI | Supporters |

4. **Submit Transaction**
   - Review all details
   - Approve transaction in wallet
   - Save your Publisher Cap ID

5. **Access Your Publication**
   - Publication appears in "My Publications"
   - Publisher Cap grants admin rights
   - Share publication link with readers

### Publishing Articles

#### Writing Articles

1. **Access Write Article Page**
   - From your publication dashboard
   - Click "Write New Article"

2. **Article Editor Features**

   ```
   Title: [Your Article Title]

   Excerpt: [Preview text for readers]

   Content Editor:
   - Rich text formatting
   - Markdown support
   - Image embedding
   - Code blocks
   - Tables and lists
   ```

3. **Choose Access Tier**

   Select who can read your article:
   - **FREE**: Available to everyone
   - **BASIC**: Requires Basic or Premium subscription
   - **PREMIUM**: Requires Premium subscription only

#### Publishing Process

1. **Write Your Content**
   - Use the rich text editor
   - Add images via Walrus upload
   - Preview your article

2. **Set Article Metadata**
   ```
   Title: "Understanding Web3 Publishing"
   Excerpt: "A deep dive into decentralized content..."
   Tier: PREMIUM
   Tags: ["web3", "publishing", "blockchain"]
   ```

3. **Encrypt and Upload**

   The publishing process:
   ```
   Your Article → Encryption → Walrus Storage → Pay Deposit → Blockchain Record
   ```

   Progress stages:
   - **Encrypting**: Content encrypted locally
   - **Uploading**: Stored on Walrus network
   - **Calculating Deposit**: 1% of premium price required
   - **Paying Deposit**: Non-refundable article deposit
   - **Registering**: Recorded on blockchain
   - **Publishing**: Article goes live

   **Article Publishing Costs:**
   ```
   Publication Premium Price: 500 SUI/month
   ├─> Required Deposit: 5 SUI (1% of 500)
   ├─> Purpose: Prevents spam, covers infrastructure
   ├─> Status: Non-refundable
   └─> Frequency: One-time per article

   Publication Premium Price: 1000 SUI/month
   └─> Required Deposit: 10 SUI (1% of 1000)

   Publication Premium Price: 0 SUI (Free Publication)
   └─> Required Deposit: 0 SUI (No cost!)
   ```

   **Important Notes:**
   - ⚠️ Deposits are **non-refundable** (even if you delete the article)
   - ✅ Free publications (Premium = 0) have **zero deposit cost**
   - 💡 Higher premium prices = higher deposit (encourages quality)
   - 🎯 Deposit goes to protocol treasury for sustainability

4. **Confirmation**
   - Deposit paid successfully
   - Article ID generated
   - View live article
   - Share with readers

### Managing Your Publication

#### Dashboard Overview

Your publisher dashboard shows:

```
┌──────────────────────────────────────────┐
│ Publication Stats                        │
├──────────────────────────────────────────┤
│ Total Articles: 42                       │
│ Active Subscribers: 156                  │
│ Monthly Revenue: 850 SUI (after 1% fee)  │
│ Royalties Earned: 45 SUI (secondary)    │
│ Total Views: 12,450                      │
└──────────────────────────────────────────┘

Recent Articles          Recent Subscribers
─────────────          ─────────────────
1. Article Title        User1 - Premium
2. Article Title        User2 - Basic
```

**Understanding Your Revenue:**

1. **Primary Subscription Sales** (Direct subscribers)
   ```
   Subscriber Pays: 500 SUI
   ├─> Platform Fee (1%): 5 SUI
   └─> You Receive: 495 SUI (99%)
   ```

2. **Secondary Market Royalties** (Resold subscriptions)
   ```
   Sale Price: 300 SUI
   ├─> Seller Receives: 300 SUI
   ├─> Royalty to You (10%): 30 SUI
   └─> Buyer Pays: 330 SUI total
   ```

3. **Total Monthly Income Example:**
   ```
   100 new subscribers × 495 SUI = 49,500 SUI
   +  20 secondary sales × 30 SUI avg = 600 SUI
   -  10 articles × 5 SUI deposit = 50 SUI
   ─────────────────────────────────────────
   Net Monthly Income: 50,050 SUI
   ```

**Withdrawing Royalties:**

- Primary revenue goes directly to your wallet
- Secondary market royalties accumulate in transfer policy
- Withdraw royalties from publisher dashboard
- No minimum withdrawal amount
3. Article Title        User3 - Free
```

#### Article Management

From your dashboard, you can:

- **Edit Articles**: Update title, excerpt, or tier
- **Archive Articles**: Soft delete (remains on blockchain)
- **View Analytics**: See reads, views, and engagement
- **Manage Access**: Change tier requirements

#### Subscriber Management

Monitor your subscriber base:

- View active subscriptions by tier
- Track renewal rates
- Analyze subscriber growth
- Export subscriber data

### Analytics and Insights

#### Available Metrics

1. **Article Performance**
   - Views per article
   - Read completion rates
   - Most popular content
   - Reader engagement time

2. **Subscription Analytics**
   - New vs. renewed subscriptions
   - Tier distribution
   - Churn rate
   - Lifetime value

3. **Revenue Tracking**
   - Monthly recurring revenue
   - Per-article earnings
   - Payment history
   - Projection models

#### Using Analytics

Access analytics from your dashboard:

```
Article Analytics:
┌────────────────────────┐
│ "Web3 Publishing"      │
├────────────────────────┤
│ Views: 1,234          │
│ Reads: 567            │
│ Completion: 78%       │
│ Avg Time: 4:32        │
└────────────────────────┘
```

---

## Wallet Setup

### Supported Wallets

The platform supports these Sui wallets:

1. **Sui Wallet** (Recommended)
   - Official Mysten Labs wallet
   - [Download](https://chrome.google.com/webstore/detail/sui-wallet)

2. **Suiet Wallet**
   - Feature-rich alternative
   - [Download](https://suiet.app)

3. **Ethos Wallet**
   - User-friendly interface
   - [Download](https://ethoswallet.xyz)

### Installing Sui Wallet

1. **Download Extension**
   - Visit Chrome Web Store
   - Search "Sui Wallet"
   - Click "Add to Chrome"

2. **Create New Wallet**
   - Click extension icon
   - Select "Create New Wallet"
   - Write down recovery phrase
   - Set password

3. **Get Testnet SUI**
   - Switch to testnet network
   - Click "Request Testnet SUI"
   - Or visit [Sui Faucet](https://discord.com/channels/916379725201563759)

### Connecting to the Platform

1. **Click "Connect Wallet"**
   - Located in top-right corner
   - Select your wallet type

2. **Approve Connection**
   - Review permissions
   - Click "Connect" in wallet popup

3. **Verify Connection**
   - Your address appears in header
   - Balance shown in SUI

### Security Best Practices

- **Never share your seed phrase**
- **Use a hardware wallet for large amounts**
- **Verify transaction details before signing**
- **Keep wallet software updated**
- **Use different wallets for different purposes**

---

## Platform Features

### Search and Discovery

#### Search Functionality

Use the search bar to find:
- Publications by name
- Articles by title
- Publishers by address

Search tips:
- Use quotes for exact matches: `"blockchain basics"`
- Combine terms: `web3 AND publishing`
- Exclude terms: `crypto -bitcoin`

#### Filters and Sorting

Filter options:
- **Tier**: Free, Basic, Premium
- **Date**: Newest, Oldest
- **Popularity**: Most subscribers, views
- **Price**: Low to high, high to low

### Content Encryption

#### How Encryption Works

```
Article Creation:
Author → Writes Content → Encrypts Locally → Uploads to Storage

Article Reading:
Reader → Verifies Access → Downloads Encrypted → Decrypts Locally
```

#### Privacy Features

- **Client-side encryption**: Content never leaves your browser unencrypted
- **No tracking**: Reading history isn't stored on-chain
- **Pseudonymous**: Only wallet addresses visible
- **Secure keys**: Decryption keys released only with valid access

### Subscription NFTs

#### What are Subscription NFTs?

Subscription NFTs are blockchain tokens that represent your access rights:

- **Unique**: Each subscription is a unique NFT
- **Transferable**: Can be sent to other wallets
- **Verifiable**: On-chain proof of access
- **Time-bound**: Include expiration date

#### Managing NFTs

View in your wallet:
```
Subscription NFT #12345
Publication: Tech Weekly
Tier: Premium
Expires: 2025-02-15
Owner: 0x123...abc
```

### Mobile Experience

The platform is fully responsive:

- **Mobile Browser**: Full functionality
- **Wallet Connect**: Mobile wallet support
- **Offline Reading**: Cache decrypted articles
- **Progressive Web App**: Install as app

---

## Troubleshooting

### Common Issues

#### Cannot Connect Wallet

**Problem**: "No wallet detected" error

**Solutions**:
1. Install a Sui wallet extension
2. Refresh the page
3. Check wallet is unlocked
4. Try different browser

#### Transaction Failures

**Problem**: "Transaction failed" error

**Common Causes & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| Insufficient gas | Low SUI balance | Add more SUI to wallet |
| User rejected | Cancelled in wallet | Try again and approve |
| Network error | Connection issue | Check internet, retry |
| Invalid input | Wrong parameters | Refresh and retry |

#### Cannot Read Articles

**Problem**: Articles won't decrypt

**Checklist**:
- [ ] Verify active subscription
- [ ] Check subscription tier matches article
- [ ] Ensure wallet is connected
- [ ] Try refreshing the page
- [ ] Clear browser cache

#### Upload Failures

**Problem**: "Failed to upload article"

**Solutions**:
1. Check file size (max 100MB)
2. Verify network connection
3. Ensure sufficient SUI for gas
4. Try smaller content first
5. Contact support if persists

### Error Messages

| Error Message | Meaning | Action |
|--------------|---------|---------|
| "Access Denied" | No valid subscription | Purchase subscription |
| "Network Error" | Connection failed | Check internet |
| "Insufficient Funds" | Not enough SUI | Add SUI to wallet |
| "Invalid Signature" | Wallet issue | Reconnect wallet |
| "Content Not Found" | Article deleted | Contact publisher |
| "Decryption Failed" | Key server issue | Retry in few minutes |

### Getting Help

1. **Check Documentation**: Review this guide
2. **Community Discord**: Join our Discord server
3. **GitHub Issues**: Report bugs
4. **Email Support**: support@platform.com

---

## FAQs

### General Questions

**Q: What is the Private Publishing Platform?**
A: A decentralized platform for publishing and monetizing encrypted content using blockchain technology.

**Q: Which blockchain does it use?**
A: The platform is built on the Sui blockchain.

**Q: Is my content really encrypted?**
A: Yes, all article content is encrypted client-side before storage.

### Reader FAQs

**Q: How do subscriptions work?**
A: Subscriptions are NFTs that grant access to content for a specified duration (typically 30 days).

**Q: Can I share my subscription?**
A: Subscriptions are NFTs tied to your wallet. You can transfer them, but can't use them simultaneously.

**Q: What happens when my subscription expires?**
A: You lose access to tier-restricted content but keep access to free articles.

**Q: Can I get a refund?**
A: Blockchain transactions are irreversible. Contact the publisher directly for issues.

### Publisher FAQs

**Q: How much does it cost to create a publication?**
A: Creating a publication costs approximately 1-2 SUI in gas fees.

**Q: Can I change subscription prices?**
A: Yes, you can update pricing for new subscriptions. Existing subscriptions maintain their terms.

**Q: How do I receive payments?**
A: Payments go directly to your wallet immediately upon subscription purchase.

**Q: Can I delete articles?**
A: Articles can be archived (hidden) but not deleted from the blockchain.

**Q: What's the maximum article size?**
A: Articles can be up to 100MB, though 1-10MB is recommended for performance.

### Technical FAQs

**Q: Why does it take time to decrypt articles?**
A: Decryption requires fetching encrypted content and obtaining decryption keys from multiple servers.

**Q: Is the platform open source?**
A: Yes, the smart contracts and frontend code are open source.

**Q: Can I run my own instance?**
A: Yes, you can deploy your own instance of the platform.

**Q: What data is stored on-chain?**
A: Only metadata (titles, IDs, ownership) is on-chain. Content is stored on Walrus.

### Payment FAQs

**Q: What currency is used?**
A: All payments are in SUI, the native token of the Sui blockchain.

**Q: Where can I get SUI?**
A: Purchase SUI on exchanges like Binance, OKX, or KuCoin.

**Q: Are there transaction fees?**
A: Yes, small gas fees (typically 0.001-0.01 SUI) for blockchain transactions.

**Q: Can I pay with credit card?**
A: Not directly, but some wallets offer fiat on-ramps.

---

## Tips and Best Practices

### For Readers

1. **Start with Free Tiers**: Try free content before subscribing
2. **Bundle Subscriptions**: Some publishers offer discounts
3. **Check Expiration Dates**: Renew before expiration to maintain access
4. **Bookmark Favorites**: Save frequently read publications
5. **Enable Notifications**: Get alerts for new content

### For Publishers

1. **Consistent Publishing**: Regular content keeps subscribers
2. **Tier Strategy**: Offer clear value at each tier
3. **Engage Readers**: Respond to feedback and comments
4. **Preview Content**: Provide compelling excerpts
5. **Price Competitively**: Research similar publications
6. **Promote Externally**: Share on social media
7. **Analytics Usage**: Track what content performs best

### Security Tips

1. **Backup Wallet**: Store recovery phrase safely
2. **Use Hardware Wallet**: For valuable NFTs
3. **Verify URLs**: Avoid phishing sites
4. **Small Test First**: Try with small amounts
5. **Keep Software Updated**: Wallet and browser

---

## Glossary

| Term | Definition |
|------|------------|
| **Blockchain** | Distributed ledger technology |
| **dApp** | Decentralized application |
| **Encryption** | Process of encoding information |
| **Gas Fees** | Transaction processing costs |
| **NFT** | Non-fungible token (unique digital asset) |
| **Private Key** | Secret key for wallet access |
| **Publisher Cap** | Admin token for publication management |
| **Smart Contract** | Self-executing blockchain program |
| **SUI** | Native token of Sui blockchain |
| **Subscription NFT** | Token representing access rights |
| **Wallet** | Software for managing crypto assets |
| **Walrus** | Decentralized storage network |
| **Web3** | Decentralized internet paradigm |

---

## Contact and Support

### Support Channels

- **Documentation**: You're reading it!
- **Discord Community**: [Join Discord](https://discord.gg/platform)
- **Twitter**: [@platform](https://twitter.com/platform)
- **Email**: support@platform.com
- **GitHub**: [Issue Tracker](https://github.com/platform/issues)

### Business Inquiries

- **Partnerships**: partners@platform.com
- **Press**: press@platform.com
- **Publishers**: publishers@platform.com

### Emergency Support

For urgent issues:
1. Check system status page
2. Join Discord emergency channel
3. Email: urgent@platform.com

---

*Last Updated: January 2025*