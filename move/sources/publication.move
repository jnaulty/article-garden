/// Module: publication
/// Manages publications and publisher capabilities for the private publishing platform
module private_publishing::publication {
    use std::string::String;
    use sui::event;
    use sui::package;

    // Error codes
    const EInvalidPrice: u64 = 1;
    const EInvalidPublicationId: u64 = 2;

    /// One-time witness for claiming Publisher
    public struct PUBLICATION has drop {}

    /// Module initializer - creates and transfers Publisher to deployer
    fun init(otw: PUBLICATION, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        transfer::public_transfer(publisher, ctx.sender());
    }

    // Events
    public struct PublicationCreated has copy, drop {
        publication_id: ID,
        creator: address,
        name: String,
    }

    public struct PricingUpdated has copy, drop {
        publication_id: ID,
        basic_price: u64,
        premium_price: u64,
    }

    public struct FreeTierToggled has copy, drop {
        publication_id: ID,
        enabled: bool,
    }

    /// Represents a publication (e.g., a newsletter, blog, or content series)
    public struct Publication has key, store {
        id: UID,
        name: String,
        description: String,
        creator: address,
        free_tier_enabled: bool,
        basic_price: u64,      // Monthly price in MIST
        premium_price: u64,    // Monthly price in MIST
        article_count: u64,
    }

    /// Capability object proving ownership of a publication
    /// Required for all privileged operations
    public struct PublisherCap has key, store {
        id: UID,
        publication_id: ID,
    }

    /// Creates a new publication and returns the PublisherCap to the creator
    /// The Publication object is made shared so anyone can read it for subscriptions
    public fun create_publication(
        name: String,
        description: String,
        basic_price: u64,
        premium_price: u64,
        free_tier_enabled: bool,
        ctx: &mut TxContext
    ): PublisherCap {
        // Validate pricing
        assert!(premium_price >= basic_price, EInvalidPrice);

        let publication_uid = object::new(ctx);
        let publication_id = object::uid_to_inner(&publication_uid);
        let creator = ctx.sender();

        let publication = Publication {
            id: publication_uid,
            name,
            description,
            creator,
            free_tier_enabled,
            basic_price,
            premium_price,
            article_count: 0,
        };

        let publisher_cap = PublisherCap {
            id: object::new(ctx),
            publication_id,
        };

        event::emit(PublicationCreated {
            publication_id,
            creator,
            name: publication.name,
        });

        // Share the publication so anyone can read it
        transfer::share_object(publication);

        publisher_cap
    }

    /// Updates subscription pricing for a publication
    /// Requires PublisherCap to prove ownership
    public fun update_pricing(
        publication: &mut Publication,
        publisher_cap: &PublisherCap,
        basic_price: u64,
        premium_price: u64,
    ) {
        // Verify ownership
        assert!(
            publisher_cap.publication_id == object::id(publication),
            EInvalidPublicationId
        );

        // Validate pricing
        assert!(premium_price >= basic_price, EInvalidPrice);

        publication.basic_price = basic_price;
        publication.premium_price = premium_price;

        event::emit(PricingUpdated {
            publication_id: object::id(publication),
            basic_price,
            premium_price,
        });
    }

    /// Toggles the free tier availability
    public fun toggle_free_tier(
        publication: &mut Publication,
        publisher_cap: &PublisherCap,
        enabled: bool,
    ) {
        // Verify ownership
        assert!(
            publisher_cap.publication_id == object::id(publication),
            EInvalidPublicationId
        );

        publication.free_tier_enabled = enabled;

        event::emit(FreeTierToggled {
            publication_id: object::id(publication),
            enabled,
        });
    }

    /// Increments the article count (called by article module)
    public(package) fun increment_article_count(publication: &mut Publication) {
        publication.article_count = publication.article_count + 1;
    }

    // === Accessor Functions ===

    public fun id(publication: &Publication): ID {
        object::id(publication)
    }

    public fun name(publication: &Publication): String {
        publication.name
    }

    public fun description(publication: &Publication): String {
        publication.description
    }

    public fun creator(publication: &Publication): address {
        publication.creator
    }

    public fun free_tier_enabled(publication: &Publication): bool {
        publication.free_tier_enabled
    }

    public fun basic_price(publication: &Publication): u64 {
        publication.basic_price
    }

    public fun premium_price(publication: &Publication): u64 {
        publication.premium_price
    }

    public fun article_count(publication: &Publication): u64 {
        publication.article_count
    }

    public fun publisher_cap_publication_id(cap: &PublisherCap): ID {
        cap.publication_id
    }

    /// Helper function to get the maximum subscription price (premium tier)
    /// Used for calculating article publishing deposits
    public fun get_max_subscription_price(publication: &Publication): u64 {
        publication.premium_price
    }

    /// Helper function to check if a publication has any paid tiers
    /// Returns true if either basic or premium price is greater than 0
    public fun has_paid_tiers(publication: &Publication): bool {
        publication.basic_price > 0 || publication.premium_price > 0
    }

    // === Test-only functions ===

    #[test_only]
    public fun create_for_testing(ctx: &mut TxContext): (Publication, PublisherCap) {
        // Create publication components manually for testing
        // (tests need the Publication object directly, not shared)
        let publication_uid = object::new(ctx);
        let publication_id = object::uid_to_inner(&publication_uid);

        let publication = Publication {
            id: publication_uid,
            name: b"Test Publication".to_string(),
            description: b"Test Description".to_string(),
            creator: ctx.sender(),
            free_tier_enabled: true,
            basic_price: 5_000_000_000,
            premium_price: 15_000_000_000,
            article_count: 0,
        };

        let publisher_cap = PublisherCap {
            id: object::new(ctx),
            publication_id,
        };

        (publication, publisher_cap)
    }
}
