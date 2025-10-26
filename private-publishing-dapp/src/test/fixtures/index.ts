/**
 * Test fixtures for domain objects
 * Provides realistic mock data for tests
 */

import { Tier, Article, Publication, SubscriptionNFT, ReadToken, PublisherCap, PublicationStats } from '../../types';

/**
 * Mock Publication
 */
export const mockPublication: Publication = {
  id: '0xpublication123',
  name: 'Test Publication',
  description: 'A test publication for unit tests',
  creator: '0xcreator123',
  free_tier_enabled: true,
  basic_price: '1000000000', // 1 SUI
  premium_price: '5000000000', // 5 SUI
  article_count: '10',
};

/**
 * Mock PublisherCap (ownership proof)
 */
export const mockPublisherCap: PublisherCap = {
  id: '0xpublishercap123',
  publication_id: mockPublication.id,
};

/**
 * Mock Article (encrypted)
 */
export const mockArticle: Article = {
  id: '0xarticle123',
  publication_id: mockPublication.id,
  title: 'Test Article',
  excerpt: 'This is a test article excerpt',
  walrus_blob_id: 'blob-abc123xyz',
  seal_key_id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // 16 bytes
  tier: Tier.Basic,
  published_at: '1704067200000', // 2024-01-01 00:00:00 UTC
  is_archived: false,
};

/**
 * Mock Article (Premium tier)
 */
export const mockPremiumArticle: Article = {
  ...mockArticle,
  id: '0xarticle456',
  title: 'Premium Test Article',
  tier: Tier.Premium,
};

/**
 * Mock Article (Free tier)
 */
export const mockFreeArticle: Article = {
  ...mockArticle,
  id: '0xarticle789',
  title: 'Free Test Article',
  tier: Tier.Free,
};

/**
 * Mock SubscriptionNFT (active)
 */
export const mockSubscription: SubscriptionNFT = {
  id: '0xsubscription123',
  publication_id: mockPublication.id,
  tier: Tier.Premium,
  subscribed_at: '1704067200000', // 2024-01-01
  expires_at: '1735689600000', // 2025-01-01 (1 year later)
  subscriber: '0xsubscriber123',
};

/**
 * Mock SubscriptionNFT (Basic tier)
 */
export const mockBasicSubscription: SubscriptionNFT = {
  ...mockSubscription,
  id: '0xsubscription456',
  tier: Tier.Basic,
};

/**
 * Mock SubscriptionNFT (expired)
 */
export const mockExpiredSubscription: SubscriptionNFT = {
  ...mockSubscription,
  id: '0xsubscription789',
  expires_at: '1672531200000', // 2023-01-01 (expired)
};

/**
 * Mock ReadToken (valid)
 */
export const mockReadToken: ReadToken = {
  id: '0xtoken123',
  article_id: mockArticle.id,
  reader: '0xreader123',
  created_at: '1704067200000', // 2024-01-01
  expires_at: String(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
};

/**
 * Mock ReadToken (expired)
 */
export const mockExpiredReadToken: ReadToken = {
  ...mockReadToken,
  id: '0xtoken456',
  expires_at: '1672531200000', // 2023-01-01 (expired)
};

/**
 * Mock PublicationStats
 */
export const mockPublicationStats: PublicationStats = {
  id: '0xstats123',
  publication_id: mockPublication.id,
  total_subscribers: '150',
  free_tier: '50',
  basic_tier: '60',
  premium_tier: '40',
  total_revenue: '100000000000', // 100 SUI
  total_views: '5000',
};

/**
 * Mock wallet addresses
 */
export const mockAddresses = {
  publisher: '0xpublisher123abc',
  subscriber: '0xsubscriber456def',
  reader: '0xreader789ghi',
  admin: '0xadmin000jkl',
};

/**
 * Mock encrypted content (as Uint8Array)
 */
export const mockEncryptedData = new Uint8Array([
  // Simplified mock - real encrypted data is BCS-serialized
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
]);

/**
 * Mock Seal key servers
 */
export const mockKeyServers = [
  '0xkeyserver1',
  '0xkeyserver2',
];

/**
 * Mock package IDs
 */
export const mockPackageId = '0xpackage123';
export const mockTreasuryId = '0xtreasury123';
export const mockClockId = '0x6'; // Standard Sui clock object

/**
 * Factory functions for creating test data with overrides
 */

export const createMockArticle = (overrides: Partial<Article> = {}): Article => ({
  ...mockArticle,
  ...overrides,
});

export const createMockPublication = (overrides: Partial<Publication> = {}): Publication => ({
  ...mockPublication,
  ...overrides,
});

export const createMockSubscription = (overrides: Partial<SubscriptionNFT> = {}): SubscriptionNFT => ({
  ...mockSubscription,
  ...overrides,
});

export const createMockReadToken = (overrides: Partial<ReadToken> = {}): ReadToken => ({
  ...mockReadToken,
  ...overrides,
});
