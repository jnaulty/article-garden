# 🔐 Private Publishing Platform

A decentralized, privacy-first publishing platform built on Sui blockchain. Think **Substack meets encryption** - where content is end-to-end encrypted, subscriptions are NFTs, and privacy is the default.

This is an educational project and is not meant for production use. It has not been audited.

## 🚀 **[Quick Start →](./QUICKSTART.md)** | 📖 **[Full Setup Guide →](./SETUP.md)**

## 🎯 What Makes This Unique

This project combines Sui's most powerful primitives:

- **🔒 Seal** - End-to-end encryption for articles
- **💾 Walrus** - Decentralized content storage
- **🏪 Kiosk** - NFT-based subscriptions with transfer policies
- **⏰ Session Keys** - Time-limited content access
- **💰 Transfer Policies** - Automatic creator royalties
- **👤 zkLogin** - Web2 Identity with Web3 Login **SOON**

## 🌟 Core Features

### For Writers

- ✅ **Create Publications** - Your own encrypted publication space
- ✅ **Write Articles** - Markdown editor with encryption
- ✅ **Set Pricing Tiers** - Free, Basic ($5/mo), Premium ($15/mo)
- ✅ **Automatic Royalties** - Earn on subscription resales (10-15%)
- ✅ **Pay-Per-Article** - Single article purchases **SOON**
- ✅ **OnChain Analytics** - Subscriber counts, revenue, for downstream usecases **SOON**

### For Readers

- ✅ **Anonymous Subscriptions** - Subscribe without revealing identity
- ✅ **Encrypted Reading** - End-to-end encrypted content
- ✅ **NFT Subscriptions** - Stored in your Kiosk
- ✅ **Multi-Tier Access** - Choose your subscription level
- ✅ **Resellable** - Trade subscriptions on secondary market **SOON**
- ✅ **Pay-Per-Article** - Buy single articles **SOON**

### Privacy Features

- ✅ **Anonymous Subscriptions** - zkLogin for identity privacy
- ✅ **Encrypted Content** - Seal encryption for all articles
- ✅ **Session-Based Access** - 30-minute read sessions

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Publication Layer                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Publication                                             │
│  ├── PublisherCap (ownership)                           │
│  ├── Tiers: Free, Basic, Premium                        │
│  ├── Pricing: 0, 5, 15 SUI/month                        │
│  └── Articles (encrypted on Walrus)                     │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Subscription Layer                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SubscriptionNFT (in Kiosk)                             │
│  ├── Tier: Free/Basic/Premium                           │
│  ├── Expiry: Timestamp                                  │
│  ├── Publication ID                                     │
│  └── Transfer Policy (with royalties)                   │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Privacy Layer (Seal)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SessionKey (30-min TTL)                                │
│  ├── User signature                                     │
│  ├── Decryption capabilities                            │
│  └── Auto-expiry                                        │
│                                                          │
│  EncryptedArticle                                       │
│  ├── Walrus blob ID                                     │
│  ├── Seal encryption                                    │
│  └── Access control metadata                            │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Storage Layer (Walrus)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Encrypted Content Blobs                                │
│  ├── Article markdown (encrypted)                       │
│  ├── Images (encrypted)                                 │
│  └── Metadata (on-chain)                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📋 Move Modules

### 1. `publication.move`
Core publication management

```move
public struct Publication has key {
    id: UID,
    name: String,
    description: String,
    creator: address,
    free_tier_enabled: bool,
    basic_price: u64,      // Monthly price in MIST
    premium_price: u64,
    article_count: u64,
}

public struct PublisherCap has key, store {
    id: UID,
    publication_id: ID,
}

// Functions
public fun create_publication(...)
public fun update_pricing(...)
public fun publish_article(...)
```

### 2. `subscription.move`
NFT-based subscriptions with Kiosk integration

```move
public struct SubscriptionNFT has key, store {
    id: UID,
    publication_id: ID,
    tier: Tier,
    subscribed_at: u64,
    expires_at: u64,
    subscriber: address,  // Can be anonymous
}

public enum Tier has copy, drop, store {
    Free,
    Basic,
    Premium,
}

// Functions
public fun subscribe(...)
public fun renew_subscription(...)
public fun place_in_kiosk(...)
```

### 3. `article.move`
Encrypted article management

```move
public struct Article has key {
    id: UID,
    publication_id: ID,
    title: String,
    excerpt: String,
    walrus_blob_id: String,    // Encrypted content
    seal_key_id: vector<u8>,   // Seal encryption key
    tier: Tier,                // Access level required
    published_at: u64,
    views: u64,                // Private counter
}

// Functions
public fun publish_article(...)
public fun verify_access(...)
public fun increment_views(...)
```

### 4. `access_control.move`
Permission verification

```move
public struct ReadToken has key {
    id: UID,
    article_id: ID,
    reader: address,
    expires_at: u64,
}

// Functions
public fun verify_subscription(...)
public fun generate_read_token(...)
public fun check_tier_access(...)
```

### 5. `marketplace_policies.move`
Transfer policies for subscription trading

```move
public struct SubscriptionPolicy has key {
    id: UID,
    royalty_bps: u64,  // Basis points (1000 = 10%)
    creator: address,
}

// Functions
public fun create_subscription_policy(...)
public fun add_royalty_rule(...)
public fun verify_transfer(...)
```

### 6. `analytics.move`
Private metrics (creator-only)

```move
public struct PublicationStats has key {
    id: UID,
    publication_id: ID,
    total_subscribers: u64,
    free_tier: u64,
    basic_tier: u64,
    premium_tier: u64,
    total_revenue: u64,
    total_views: u64,
}

// Functions (creator-only)
public fun get_stats(...)
public fun record_subscription(...)
public fun record_revenue(...)
```

## 🎮 User Flows

### Flow 1: Writer Creates Publication

```
1. Connect wallet
2. Click "Create Publication"
3. Fill details: name, description, pricing tiers
4. Transaction creates:
   - Publication object
   - PublisherCap (ownership proof)
   - PublicationStats (private analytics)
   - Transfer policies for subscriptions
5. Publisher dashboard unlocked
```

### Flow 2: Writer Publishes Article

```
1. Open publisher dashboard
2. Click "New Article"
3. Write in markdown editor
4. Set tier: Free/Basic/Premium
5. Frontend:
   - Encrypts content with Seal
   - Uploads to Walrus
   - Gets blob ID
6. Transaction creates Article object with:
   - Metadata (title, tier, etc)
   - Walrus blob ID
   - Seal encryption key
7. Article visible to eligible subscribers
```

### Flow 3: Reader Subscribes (Anonymous)

```
1. Browse publications
2. Click "Subscribe" on publication
3. Choose tier: Basic ($5) or Premium ($15)
4. Optional: Use zkLogin for anonymity
5. Transaction:
   - Mints SubscriptionNFT
   - Places in reader's Kiosk
   - Sets expiry (30 days from now)
   - Records in private analytics
6. Reader can now access tier-appropriate articles
```

### Flow 4: Reader Accesses Article

```
1. Navigate to article
2. Frontend checks:
   - Does user have SubscriptionNFT in Kiosk?
   - Is subscription still valid (not expired)?
   - Does tier match article requirement?
3. If valid:
   - Generate SessionKey (30-min TTL)
   - Fetch encrypted blob from Walrus
   - Decrypt with Seal using SessionKey
   - Display article
4. Session expires after 30 minutes
```

### Flow 5: Resell Subscription

```
1. Go to "My Subscriptions"
2. Click "List for Sale" on subscription
3. Set price (e.g., 3 SUI for remaining 20 days)
4. SubscriptionNFT listed in Kiosk
5. Buyer purchases
6. Transfer policy enforces:
   - 10% royalty to creator
   - Ownership transfers
   - Subscription continues for buyer
```

### Flow 6: Pay-Per-Article

```
1. Browse article
2. Don't have subscription
3. Click "Unlock This Article" ($0.50)
4. Transaction creates:
   - Single-use ReadToken
   - Expires in 24 hours
5. Can read this article only
6. Token expires/consumed
```

## 🛠️ Technology Stack

### Smart Contracts (Move)
- **Sui Move** - Core blockchain logic
- **Kiosk** - NFT subscription management
- **Transfer Policies** - Royalty enforcement
- **Seal** - Encryption primitives
- **Walrus** - Decentralized storage

### Frontend (React + TypeScript)
- **@mysten/dapp-kit** - Wallet integration
- **@mysten/sui** - Sui TypeScript SDK
- **@mysten/seal** - Encryption SDK
- **@mysten/walrus** - Storage SDK
- **@mysten/messaging** - Adapted patterns
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### Key Patterns
- **SessionKeyProvider** - Seal session management
- **PublishingClientProvider** - Seal + Walrus client
- **usePublication** - Publication CRUD
- **useSubscription** - Subscription management
- **useEncryptedArticle** - Decrypt and display

## 📁 Project Structure

```
article-garden/
├── move/                           # Smart contracts
│   ├── sources/
│   │   ├── publication.move
│   │   ├── subscription.move
│   │   ├── article.move
│   │   ├── access_control.move
│   │   ├── marketplace_policies.move
│   │   └── analytics.move
│   ├── tests/
│   │   ├── publication_tests.move
│   │   ├── subscription_tests.move
│   │   └── access_tests.move
│   └── Move.toml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── PublicationList.tsx
│   │   │   ├── PublicationDetail.tsx
│   │   │   ├── ArticleReader.tsx
│   │   │   ├── Subscribe.tsx
│   │   │   ├── MySubscriptions.tsx
│   │   │   ├── PublisherDashboard.tsx
│   │   │   ├── CreatePublication.tsx
│   │   │   ├── WriteArticle.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── SubscriptionMarketplace.tsx
│   │   ├── components/
│   │   │   ├── SessionKeyProvider.tsx
│   │   │   ├── PublishingClientProvider.tsx
│   │   │   ├── EncryptedArticleViewer.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── TierSelector.tsx
│   │   │   ├── PaymentFlow.tsx
│   │   │   └── MarkdownEditor.tsx
│   │   ├── hooks/
│   │   │   ├── usePublication.ts
│   │   │   ├── useSubscription.ts
│   │   │   ├── useArticle.ts
│   │   │   ├── useEncryption.ts
│   │   │   ├── useWalrus.ts
│   │   │   └── useKiosk.ts
│   │   └── lib/
│   │       ├── seal-client.ts
│   │       ├── walrus-client.ts
│   │       └── encryption.ts
│   └── ...
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SEAL_INTEGRATION.md
│   ├── WALRUS_SETUP.md
│   ├── KIOSK_POLICIES.md
│   └── PRIVACY_FEATURES.md
└── README.md (this file)
```

## 🎓 Sui Touchpoints 


### Encryption & Privacy
- ✅ Seal encryption/decryption
- ✅ Session key management
- ✅ End-to-end encryption patterns
- ✅ Anonymous user identity (zkLogin)
- ✅ Private metrics and analytics

### Storage
- ✅ Walrus blob storage
- ✅ Encrypted content storage
- ✅ Metadata vs content separation
- ✅ Content addressing

### NFTs & Marketplaces
- ✅ Kiosk for NFT management
- ✅ Transfer policies
- ✅ Royalty enforcement
- ✅ Secondary market trading
- ✅ Time-locked NFTs

### Smart Contract Design
- ✅ Access control patterns
- ✅ Capability-based security
- ✅ Modular architecture
- ✅ Upgrade strategies

## 🚀 Getting Started

### Option 1: Docker (Recommended) 🐳

```bash
# Start all services
docker-compose up -d

# Open your browser
open http://localhost:5173
```

**[See full Docker setup guide →](./SETUP.md#quick-start-docker)**

### Option 2: Manual Setup

```bash
# Install dependencies
cd private-publishing-dapp && npm install

# Start Sui network
sui start --with-faucet

# Deploy contracts
cd move && sui client publish --gas-budget 500000000

# Start frontend
cd ../private-publishing-dapp && npm run dev
```

**[See detailed manual setup →](./SETUP.md#manual-setup)**

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Seal Integration](./docs/SEAL_INTEGRATION.md)
- [Walrus Setup](./docs/WALRUS_SETUP.md)
- [Kiosk & Policies](./docs/KIOSK_POLICIES.md)

## 🌟 Use Cases

### For Creators
- Newsletter subscriptions
- Exclusive content
- Research publications
- Educational content
- Private journalism

### For Enterprises
- Internal knowledge base
- Client communications
- Confidential reports
- Partner portals
- Premium research

### For Communities
- DAO documentation
- Member-only content
- Governance proposals
- Community updates
- Fundraising campaigns

## 🔐 Privacy Guarantees

1. **Content Privacy**: Articles encrypted end-to-end with Seal
2. **Identity Privacy**: zkLogin enables anonymous subscriptions
3. **Payment Privacy**: Coin splitting hides payment source
4. **Metrics Privacy**: Subscriber counts encrypted (creator-only)
5. **Reading Privacy**: No tracking, no analytics, no surveillance


## 🤝 Contributing

This is an educational project. Contributions welcome:
- Bug fixes
- Documentation improvements
- Test coverage
- Feature suggestions

## 📄 License

Apache 2.0 License - See LICENSE.txt file

## 🙏 Acknowledgments

- **Sui Foundation** - Sui blockchain
- **Mysten Labs** - Seal, Walrus, dApp Kit
- **Messaging SDK** - Architectural patterns

---

**Built with privacy, powered by Sui** 🔐✨
