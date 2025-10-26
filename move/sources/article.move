/// Module: article
/// Manages encrypted articles with Walrus blob storage and Seal encryption
module private_publishing::article {
    use std::string::String;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use private_publishing::publication::{Self, Publication, PublisherCap};
    use private_publishing::subscription::{Self, Tier};
    use private_publishing::treasury::{Self, Treasury};

    // Error codes
    const EInvalidPublicationId: u64 = 1;
    const EInsufficientDeposit: u64 = 2;

    // Events
    public struct ArticlePublished has copy, drop {
        article_id: ID,
        publication_id: ID,
        title: String,
        tier: u8,
    }

    public struct ArticleUpdated has copy, drop {
        article_id: ID,
        title: String,
    }

    public struct ArticleArchived has copy, drop {
        article_id: ID,
    }

    /// Represents an encrypted article stored on Walrus
    public struct Article has key, store {
        id: UID,
        publication_id: ID,
        title: String,
        excerpt: String,                    // Public preview text
        walrus_blob_id: String,             // Encrypted content location on Walrus
        seal_key_id: vector<u8>,            // Seal encryption key reference
        tier: Tier,                         // Required access level
        published_at: u64,                  // Unix timestamp in seconds
        is_archived: bool,
    }

    /// Publishes a new encrypted article
    /// Only the publisher (with PublisherCap) can publish articles
    /// Requires a non-refundable deposit (1% of premium subscription price)
    /// Note: Article is shared so Seal key servers can validate access
    public fun publish_article(
        publication: &mut Publication,
        treasury: &mut Treasury,
        publisher_cap: &PublisherCap,
        title: String,
        excerpt: String,
        walrus_blob_id: String,
        seal_key_id: vector<u8>,
        tier: Tier,
        published_at: u64,
        deposit: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == publication::id(publication),
            EInvalidPublicationId
        );

        // Calculate required deposit (1% of premium price)
        let required_deposit = treasury::calculate_article_deposit(
            treasury,
            publication::premium_price(publication)
        );

        // Verify deposit amount
        let deposit_amount = coin::value(&deposit);
        assert!(deposit_amount >= required_deposit, EInsufficientDeposit);

        // Collect deposit to treasury (non-refundable)
        treasury::collect_article_deposit(
            treasury,
            deposit,
            publication::id(publication),
            ctx.sender()
        );

        // Increment article count in publication
        publication::increment_article_count(publication);

        let article_uid = object::new(ctx);
        let article_id = object::uid_to_inner(&article_uid);
        let publication_id = publication::id(publication);

        event::emit(ArticlePublished {
            article_id,
            publication_id,
            title: title,
            tier: tier_to_u8(&tier),
        });

        let article = Article {
            id: article_uid,
            publication_id,
            title,
            excerpt,
            walrus_blob_id,
            seal_key_id,
            tier,
            published_at,
            is_archived: false,
        };

        // Share the article so Seal key servers can validate access
        transfer::share_object(article);
    }

    /// Updates article metadata (title and excerpt)
    /// Cannot update encrypted content or tier after publishing
    public fun update_article(
        article: &mut Article,
        publisher_cap: &PublisherCap,
        title: String,
        excerpt: String,
    ) {
        // Verify ownership via publication_id
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == article.publication_id,
            EInvalidPublicationId
        );

        article.title = title;
        article.excerpt = excerpt;

        event::emit(ArticleUpdated {
            article_id: object::id(article),
            title,
        });
    }

    /// Archives an article (makes it hidden from listings)
    public fun archive_article(
        article: &mut Article,
        publisher_cap: &PublisherCap,
    ) {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == article.publication_id,
            EInvalidPublicationId
        );

        article.is_archived = true;

        event::emit(ArticleArchived {
            article_id: object::id(article),
        });
    }

    /// Unarchives an article (makes it visible again)
    public fun unarchive_article(
        article: &mut Article,
        publisher_cap: &PublisherCap,
    ) {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == article.publication_id,
            EInvalidPublicationId
        );

        article.is_archived = false;
    }

    // === Helper Functions ===

    /// Converts Tier enum to u8 for events
    fun tier_to_u8(tier: &Tier): u8 {
        subscription::tier_to_u8_public(tier)
    }

    // === Accessor Functions ===

    public fun id(article: &Article): ID {
        object::id(article)
    }

    public fun publication_id(article: &Article): ID {
        article.publication_id
    }

    public fun title(article: &Article): String {
        article.title
    }

    public fun excerpt(article: &Article): String {
        article.excerpt
    }

    public fun walrus_blob_id(article: &Article): String {
        article.walrus_blob_id
    }

    public fun seal_key_id(article: &Article): vector<u8> {
        article.seal_key_id
    }

    public fun tier(article: &Article): Tier {
        article.tier
    }

    public fun published_at(article: &Article): u64 {
        article.published_at
    }

    public fun is_archived(article: &Article): bool {
        article.is_archived
    }

    // === Test-only functions ===

    #[test_only]
    public fun create_for_testing(
        publication_id: ID,
        title: String,
        tier: Tier,
        published_at: u64,
        ctx: &mut TxContext
    ): Article {
        Article {
            id: object::new(ctx),
            publication_id,
            title,
            excerpt: b"Test excerpt".to_string(),
            walrus_blob_id: b"test_blob_id".to_string(),
            seal_key_id: b"test_seal_key",
            tier,
            published_at,
            is_archived: false,
        }
    }
}
