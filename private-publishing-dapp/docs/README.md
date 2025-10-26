# Private Publishing Platform - Complete Documentation

## Overview

The Private Publishing Platform is a decentralized content publishing and monetization system built on the Sui blockchain. It enables publishers to create encrypted articles, manage tiered subscriptions, and monetize their content while maintaining privacy and control.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Smart Contracts](#smart-contracts)
6. [Frontend Application](#frontend-application)
7. [Integration Details](#integration-details)
8. [Getting Started](#getting-started)
9. [Development Guide](#development-guide)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Additional Documentation](#additional-documentation)

## Architecture Overview

The platform consists of three main layers:

### 1. Smart Contract Layer (Sui Move)
- **Publication Management**: Create and manage publications
- **Article Storage**: Store article metadata and encrypted content references
- **Subscription System**: Tiered subscription NFTs (Free, Basic, Premium) with Kiosk integration
- **Access Control**: Verify user permissions for content access
- **Analytics**: Track views, reads, and engagement
- **Treasury**: Protocol fee collection (1% on subscriptions, article deposits)
- **Marketplace Policies**: Handle subscription NFT trading with royalties

### 2. Storage Layer (Walrus)
- **Distributed Storage**: Store encrypted article content off-chain
- **Content Encryption**: Client-side encryption before storage
- **Blob Management**: Handle large content files efficiently
- **Permanent Storage**: Configurable storage epochs for content persistence

### 3. Encryption Layer (Seal)
- **Policy-Based Encryption**: Encrypt articles with access policies
- **Key Management**: Distributed key servers for secure decryption
- **Access Verification**: On-chain policy verification for key release
- **Subscription Integration**: Automatic access based on subscription tier

### 4. Frontend Layer (React + Vite)
- **User Interface**: Modern React-based dApp
- **Wallet Integration**: Sui wallet connection and transaction signing
- **GraphQL Queries**: Efficient data fetching from blockchain
- **Content Management**: Article creation, editing, and publishing
- **Reader Experience**: Browse, subscribe, and read encrypted content

## Key Features

### For Publishers
- **Publication Creation**: Create and customize publications with branding
- **Tiered Pricing**: Set up Free, Basic, and Premium subscription tiers
- **Article Management**: Write, encrypt, and publish articles (requires 1% deposit)
- **Analytics Dashboard**: Track readership and engagement metrics
- **Revenue Management**: Automatic payment processing (99% to publisher, 1% treasury fee)
- **Royalty Income**: Earn 10% on secondary subscription sales in marketplace

### For Readers
- **Content Discovery**: Browse available publications and articles
- **Flexible Subscriptions**: Choose from multiple tier options
- **Encrypted Access**: Secure content access based on subscription
- **NFT Ownership**: Subscriptions are tradeable NFTs with full ownership
- **Subscription Trading**: Buy/sell subscriptions on secondary marketplace
- **Read Tokens**: Purchase individual article access without subscription
- **Wallet Integration**: Seamless Web3 experience with Sui wallets

### Security Features
- **End-to-End Encryption**: Content encrypted on client before storage
- **Policy-Based Access**: Cryptographic enforcement of access rights
- **Decentralized Storage**: Content distributed across Walrus network
- **On-Chain Verification**: All access checks verified on blockchain
- **Private Keys**: Users control their subscription NFTs and access

## Technology Stack

### Blockchain
- **Sui Network**: Layer 1 blockchain for smart contracts
- **Move Language**: Secure smart contract development
- **GraphQL API**: Efficient blockchain data queries

### Storage
- **Walrus**: Distributed blob storage network
- **IPFS-like**: Content-addressed storage with erasure coding
- **Permanent Storage**: Configurable storage duration (epochs)

### Encryption
- **Seal Protocol**: Policy-based encryption system
- **Distributed Keys**: Multiple key servers for decryption
- **Client-Side**: All encryption happens in the browser

### Frontend
- **React 18.3.1**: Modern UI framework
- **TypeScript 5.9.2**: Type-safe development
- **Vite 7.1.5**: Fast build tooling
- **Radix UI 3.2.1**: Accessible component library
- **@mysten/dapp-kit 0.19.6**: Sui wallet integration
- **@mysten/sui 1.43.1**: Sui TypeScript SDK
- **@mysten/seal 0.9.1**: Policy-based encryption
- **@mysten/walrus 0.8.1**: Storage client SDK
- **@mysten/walrus-wasm 0.1.1**: WASM storage utilities
- **TanStack Query 5.87.1**: Data fetching and caching

## Project Structure

```
private-publishing-dapp/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ArticleCard.tsx
│   │   ├── PublicationCard.tsx
│   │   ├── SubscriptionTierCard.tsx
│   │   └── WalrusUploadButton.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useArticle.ts
│   │   ├── useEncryptedArticle.ts
│   │   ├── usePublication.ts
│   │   ├── useSubscription.ts
│   │   └── useAccessQueries.ts
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── PublicationsPage.tsx
│   │   ├── PublicationDetailPage.tsx
│   │   ├── ArticleReaderPage.tsx
│   │   ├── WriteArticlePage.tsx
│   │   └── DashboardPage.tsx
│   ├── services/           # External service integrations
│   │   ├── seal.ts         # Seal encryption
│   │   └── walrus.ts       # Walrus storage
│   ├── utils/              # Utility functions
│   │   └── encryption.ts   # Encryption helpers
│   └── config/             # Configuration
│       └── constants.ts    # Network addresses
├── docs/                   # Documentation
└── move/                   # Smart contracts
    └── sources/
        ├── article.move
        ├── publication.move
        ├── subscription.move
        ├── access_control.move
        ├── seal_policy.move
        └── analytics.move
```

## Smart Contracts

### Core Modules

#### publication.move
- Creates and manages publications
- Stores publication metadata and settings
- Handles publisher capabilities
- Key functions:
  - `create_publication()`: Initialize new publication
  - `update_metadata()`: Modify publication details
  - `set_tier_pricing()`: Configure subscription tiers

#### article.move
- Manages article creation and storage
- Links to encrypted content on Walrus
- Stores Seal encryption IDs
- Key functions:
  - `create_article()`: Publish new article
  - `update_article()`: Modify existing article
  - `archive_article()`: Soft delete article

#### subscription.move
- Issues subscription NFTs to users
- Manages three tiers: Free, Basic, Premium
- Tracks expiration dates
- Key functions:
  - `purchase_subscription()`: Buy subscription
  - `upgrade_subscription()`: Move to higher tier
  - `verify_active()`: Check subscription status

#### access_control.move
- Verifies user permissions for content
- Integrates with Seal for decryption policies
- Manages read tokens for individual access
- Key functions:
  - `verify_subscription_access()`: Check subscription permits
  - `verify_read_token()`: Validate single article token
  - `create_read_token()`: Issue article access token

#### seal_policy.move
- Defines Seal encryption policies
- Called by key servers during decryption
- Enforces on-chain access rules
- Key functions:
  - `seal_approve_subscription()`: Verify subscription access
  - `seal_approve_read_token()`: Verify token access

#### analytics.move
- Tracks article views and engagement
- Records reader interactions
- Provides publisher insights
- Key functions:
  - `record_view()`: Log article view
  - `record_read()`: Track full article read
  - `get_stats()`: Retrieve analytics data

#### treasury.move
- Manages protocol treasury and fee collection
- Collects 1% fee on subscription payments
- Requires 1% deposit for article publishing (based on premium price)
- Tracks total fees and deposits collected
- Key functions:
  - `collect_subscription_fee()`: Deduct 1% from subscription payment
  - `collect_article_deposit()`: Collect non-refundable article deposit
  - `calculate_article_deposit()`: Calculate required deposit amount
  - `withdraw()`: Admin withdraws treasury funds
  - `update_fee_rates()`: Admin updates fee percentages

#### marketplace_policies.move
- Manages subscription NFT trading policies
- Enforces 10% royalty on secondary sales
- Integrates with Sui Kiosk standard
- Key functions:
  - `add_royalty_rule()`: Configure royalty percentage
  - `pay_royalty()`: Buyer pays royalty during purchase
  - `calculate_royalty_amount()`: Compute royalty from sale price
  - `withdraw_royalties()`: Publisher claims royalty earnings

## Frontend Application

### Key Components

#### Wallet Connection
- Sui wallet integration using @mysten/dapp-kit
- Support for multiple wallet providers
- Transaction signing and execution

#### Content Management
- Rich text editor for article creation
- Markdown support with preview
- Image upload via Walrus
- Draft saving and publishing workflow

#### Encryption Flow
1. Author writes article in editor
2. Content encrypted client-side with Seal
3. Encrypted blob uploaded to Walrus
4. Seal ID and Walrus blob ID stored on-chain
5. Article metadata published to blockchain

#### Decryption Flow
1. Reader requests article access
2. Subscription/token verified on-chain
3. Seal policy checked via smart contract
4. Key servers release decryption keys
5. Content retrieved from Walrus and decrypted
6. Article displayed to reader

### Data Fetching
- GraphQL queries for efficient data loading
- Real-time subscription status updates
- Cached queries for performance
- Optimistic UI updates

## Integration Details

### Walrus Integration
- Browser-compatible upload flow
- Four-step process: encode, register, upload, certify
- Handles large files with progress tracking
- See: [walrus-browser-flow.md](./walrus-browser-flow.md)

### Seal Integration
- Client-side encryption before upload
- Policy-based access control
- Distributed key management
- Automatic decryption for authorized users

### GraphQL Queries
- Custom queries for publications and articles
- Subscription status checking
- Analytics data fetching
- Efficient pagination support

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Sui wallet (e.g., Sui Wallet extension)
- Testnet SUI tokens

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the dApp directory
cd private-publishing-dapp

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Setup

The application is configured via `src/networkConfig.ts`. For testnet:

**Deployed Package ID:** `0x41f5e97994f1f15479821e68e8018b2c52b32a07aea2df59a9db1141690fd88f`
**Treasury ID:** `0xc97daeff8a72b4f0bed8f66c3c19779d78d6eedbfe3e58774a1495701f863a22`
**Seal Key Servers:**
- mysten-testnet-1: `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75`
- mysten-testnet-2: `0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8`

To deploy your own instance, update these values in `networkConfig.ts` after deployment.

### Deploy Smart Contracts

```bash
# Navigate to Move directory
cd move

# Build the package
sui move build

# Run tests
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000
```

## Development Guide

### Creating a Publication

```typescript
import { useCreatePublication } from '@/hooks/usePublication';

const { createPublication } = useCreatePublication();

await createPublication({
  name: "Tech Weekly",
  description: "Latest in technology",
  imageUrl: "https://...",
  basicPrice: 5_000_000_000, // 5 SUI
  premiumPrice: 10_000_000_000, // 10 SUI
});
```

### Publishing an Article

```typescript
import { usePublishEncryptedArticle } from '@/hooks/useEncryptedArticle';

const { publishArticle } = usePublishEncryptedArticle();

await publishArticle({
  publicationId,
  title: "Article Title",
  content: "Article content...",
  tier: "BASIC",
  excerpt: "Preview text...",
});
```

### Subscribing to a Publication

```typescript
import { usePurchaseSubscription } from '@/hooks/useSubscriptionPurchase';

const { purchaseSubscription } = usePurchaseSubscription();

await purchaseSubscription({
  publicationId,
  tier: "PREMIUM",
  payment: 10_000_000_000, // 10 SUI
});
```

## Testing

### Unit Tests (Move)
```bash
cd move
sui move test
```

### E2E Tests
```bash
cd move/e2e-tests
npm test
```

### Frontend Tests
```bash
cd private-publishing-dapp
pnpm test
```

See [E2E_TEST_PLAN.md](../E2E_TEST_PLAN.md) for comprehensive test scenarios.

## Deployment

### Smart Contracts
1. Build and test Move package
2. Deploy to testnet/mainnet
3. Save package ID and admin capabilities
4. Initialize publication with admin cap

### Frontend
1. Update environment variables
2. Build production bundle: `pnpm build`
3. Deploy to hosting service (Vercel, Netlify, etc.)
4. Configure domain and SSL

### Docker Deployment
```bash
# Build Docker image
docker build -t private-publishing-dapp .

# Run container
docker run -p 80:80 private-publishing-dapp
```

## Additional Documentation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture and design
- **[API_AND_CONTRACTS.md](./API_AND_CONTRACTS.md)** - Smart contract and API reference
- **[USER_GUIDE.md](./USER_GUIDE.md)** - End-user guide for publishers and readers
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions and best practices

### Feature Documentation
- **[TREASURY.md](./TREASURY.md)** - Treasury system, fees, and economics
- **[KIOSK_INTEGRATION.md](./KIOSK_INTEGRATION.md)** - NFT marketplace and subscription trading
- **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Frontend developer guide
- **[WALRUS_INTEGRATION.md](./WALRUS_INTEGRATION.md)** - Walrus storage integration details

### Technical Guides
- [Walrus Browser Flow](./walrus-browser-flow.md) - Browser-based storage integration
- [Wallet Signer Compatibility](./wallet-signer-compatibility-fix.md) - Wallet integration fixes
- [WASM Vite Configuration](./walrus-wasm-vite-configuration.md) - WASM setup for Vite
- [Seal Article ID Format](./seal-article-id-format.md) - Encryption ID management
- [Walrus Upload Digest Fix](./walrus-upload-digest-fix.md) - Upload verification

### Post-Mortems & Analysis
- [Missing Tests Analysis](./POST_MORTEM_MISSING_TESTS.md) - Critical testing lessons learned
- [Missing Timestamp Argument](./post-mortem-missing-timestamp-argument.md)

### Implementation Notes
- [GraphQL Integration](./graphql-notes.md)
- [Seal Session Serialization](./seal-session-serialization.md)
- [Walrus WAL Tokens](./walrus-wal-tokens.md)

## Security Considerations

### Content Encryption
- All article content encrypted client-side
- Keys never transmitted in plaintext
- Distributed key management via Seal

### Access Control
- On-chain verification of permissions
- Cryptographic enforcement of access
- No centralized access control

### Data Privacy
- No personal data stored on-chain
- Encrypted content on distributed storage
- User-controlled subscription NFTs

## Troubleshooting

### Common Issues

#### Wallet Connection Failed
- Ensure Sui wallet extension is installed
- Check network configuration (testnet/mainnet)
- Verify wallet has SUI for gas fees

#### Upload Failed
- Check Walrus network connectivity
- Verify file size limits
- Review browser console for errors

#### Decryption Failed
- Confirm active subscription
- Check Seal key server availability
- Verify article encryption ID

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

[License information]

## Support

- Documentation: This directory
- Issues: [GitHub Issues](https://github.com/...)
- Discord: [Community Discord](https://discord.gg/...)