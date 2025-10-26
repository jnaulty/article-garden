/// Module: seal_policy
/// Defines Seal access control policies for encrypted articles
///
/// These seal_approve* functions are called by Seal key servers to determine
/// if a user should be granted decryption keys for specific article IDs.
module private_publishing::seal_policy {
    use sui::clock::Clock;
    use private_publishing::article::{Self, Article};
    use private_publishing::subscription::SubscriptionNFT;
    use private_publishing::access_control::{Self, ReadToken};

    // Error codes
    const EAccessDenied: u64 = 1;

    /// Seal policy: Approve decryption based on valid subscription
    ///
    /// Called by Seal key servers during decryption to verify access.
    /// The `id` parameter is the Seal encryption ID from the encrypted object.
    ///
    /// This function aborts if access is denied, which prevents key release.
    entry fun seal_approve_subscription(
        id: vector<u8>,
        subscription: &SubscriptionNFT,
        article: &Article,
        clock: &Clock,
    ) {
        // Verify the Seal encryption ID matches the article's stored seal_key_id
        // Note: The seal_key_id may differ from the Article object ID since
        // encryption happens before the Article object is created on-chain
        let seal_key_id = article::seal_key_id(article);
        assert!(id == seal_key_id, EAccessDenied);

        // Verify subscription grants access to this article
        let has_access = access_control::verify_subscription_access(
            subscription,
            article,
            clock,
        );

        assert!(has_access, EAccessDenied);
    }

    /// Seal policy: Approve decryption based on valid read token
    ///
    /// Called by Seal key servers during decryption to verify access.
    /// The `id` parameter is the Seal encryption ID from the encrypted object.
    ///
    /// This function aborts if access is denied, which prevents key release.
    entry fun seal_approve_read_token(
        id: vector<u8>,
        token: &ReadToken,
        article: &Article,
        clock: &Clock,
    ) {
        // Verify the Seal encryption ID matches the article's stored seal_key_id
        // Note: The seal_key_id may differ from the Article object ID since
        // encryption happens before the Article object is created on-chain
        let seal_key_id = article::seal_key_id(article);
        assert!(id == seal_key_id, EAccessDenied);

        // Verify read token grants access to this article
        let has_access = access_control::verify_read_token(
            token,
            article,
            clock,
        );

        assert!(has_access, EAccessDenied);
    }
}
