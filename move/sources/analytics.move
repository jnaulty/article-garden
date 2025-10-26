/// Module: analytics
/// Private analytics for publication creators (metrics not publicly visible)
module private_publishing::analytics {
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use private_publishing::publication::{Self, Publication, PublisherCap};
    use private_publishing::subscription::{Self, Tier};

    // Error codes
    const EInvalidPublicationId: u64 = 1;

    // Events
    public struct StatsCreated has copy, drop {
        stats_id: ID,
        publication_id: ID,
    }

    public struct SubscriptionRecorded has copy, drop {
        publication_id: ID,
        tier: u8,
        total_subscribers: u64,
    }

    public struct RevenueRecorded has copy, drop {
        publication_id: ID,
        amount: u64,
        total_revenue: u64,
    }

    /// Subscription counts by tier
    public struct SubscriberCounts has store, copy, drop {
        free: u64,
        basic: u64,
        premium: u64,
    }

    /// Private analytics for a publication
    /// Only accessible by the publisher (via PublisherCap)
    public struct PublicationStats has key, store {
        id: UID,
        publication_id: ID,
        subscriber_counts: SubscriberCounts,
        total_revenue: u64,                           // Total earned in MIST
        article_views: VecMap<ID, u64>,              // article_id -> view count
    }

    /// Creates analytics tracking for a publication
    /// Should be called when creating a new publication
    public fun create_stats(
        publication: &Publication,
        publisher_cap: &PublisherCap,
        ctx: &mut TxContext
    ): PublicationStats {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == publication::id(publication),
            EInvalidPublicationId
        );

        let stats_uid = object::new(ctx);
        let stats_id = object::uid_to_inner(&stats_uid);
        let publication_id = publication::id(publication);

        event::emit(StatsCreated {
            stats_id,
            publication_id,
        });

        PublicationStats {
            id: stats_uid,
            publication_id,
            subscriber_counts: SubscriberCounts {
                free: 0,
                basic: 0,
                premium: 0,
            },
            total_revenue: 0,
            article_views: vec_map::empty(),
        }
    }

    /// Records a new subscription (increments tier counter)
    /// Called by subscription module
    public(package) fun record_subscription(
        stats: &mut PublicationStats,
        tier: Tier,
    ) {
        // Increment appropriate tier counter
        if (subscription::is_tier_free(&tier)) {
            stats.subscriber_counts.free = stats.subscriber_counts.free + 1;
        } else if (subscription::is_tier_basic(&tier)) {
            stats.subscriber_counts.basic = stats.subscriber_counts.basic + 1;
        } else {
            // Premium
            stats.subscriber_counts.premium = stats.subscriber_counts.premium + 1;
        };

        let total_subscribers =
            stats.subscriber_counts.free +
            stats.subscriber_counts.basic +
            stats.subscriber_counts.premium;

        event::emit(SubscriptionRecorded {
            publication_id: stats.publication_id,
            tier: subscription::tier_to_u8_public(&tier),
            total_subscribers,
        });
    }

    /// Records revenue from subscriptions or article sales
    /// Called when payment is received
    public(package) fun record_revenue(
        stats: &mut PublicationStats,
        amount: u64,
    ) {
        stats.total_revenue = stats.total_revenue + amount;

        event::emit(RevenueRecorded {
            publication_id: stats.publication_id,
            amount,
            total_revenue: stats.total_revenue,
        });
    }

    /// Records a view of an article
    public(package) fun record_view(
        stats: &mut PublicationStats,
        article_id: ID,
    ) {
        if (stats.article_views.contains(&article_id)) {
            let (_key, current_views) = stats.article_views.remove(&article_id);
            stats.article_views.insert(article_id, current_views + 1);
        } else {
            stats.article_views.insert(article_id, 1);
        }
    }

    /// Gets full stats (creator-only)
    /// Returns copies of all metrics
    public fun get_stats(
        stats: &PublicationStats,
        publisher_cap: &PublisherCap,
    ): (SubscriberCounts, u64, VecMap<ID, u64>) {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == stats.publication_id,
            EInvalidPublicationId
        );

        (stats.subscriber_counts, stats.total_revenue, stats.article_views)
    }

    /// Gets just subscriber counts (creator-only)
    public fun get_subscriber_counts(
        stats: &PublicationStats,
        publisher_cap: &PublisherCap,
    ): SubscriberCounts {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == stats.publication_id,
            EInvalidPublicationId
        );

        stats.subscriber_counts
    }

    /// Gets total revenue (creator-only)
    public fun get_total_revenue(
        stats: &PublicationStats,
        publisher_cap: &PublisherCap,
    ): u64 {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == stats.publication_id,
            EInvalidPublicationId
        );

        stats.total_revenue
    }

    /// Gets views for a specific article (creator-only)
    public fun get_article_views(
        stats: &PublicationStats,
        publisher_cap: &PublisherCap,
        article_id: ID,
    ): u64 {
        // Verify ownership
        assert!(
            publication::publisher_cap_publication_id(publisher_cap) == stats.publication_id,
            EInvalidPublicationId
        );

        if (stats.article_views.contains(&article_id)) {
            *stats.article_views.get(&article_id)
        } else {
            0
        }
    }

    // === Helper Functions ===

    // === Accessor Functions ===

    public fun publication_id(stats: &PublicationStats): ID {
        stats.publication_id
    }

    public fun total_subscribers(counts: &SubscriberCounts): u64 {
        counts.free + counts.basic + counts.premium
    }

    public fun free_subscribers(counts: &SubscriberCounts): u64 {
        counts.free
    }

    public fun basic_subscribers(counts: &SubscriberCounts): u64 {
        counts.basic
    }

    public fun premium_subscribers(counts: &SubscriberCounts): u64 {
        counts.premium
    }

    // === Test-only functions ===

    #[test_only]
    public fun create_stats_for_testing(
        publication_id: ID,
        ctx: &mut TxContext
    ): PublicationStats {
        PublicationStats {
            id: object::new(ctx),
            publication_id,
            subscriber_counts: SubscriberCounts {
                free: 0,
                basic: 0,
                premium: 0,
            },
            total_revenue: 0,
            article_views: vec_map::empty(),
        }
    }
}
