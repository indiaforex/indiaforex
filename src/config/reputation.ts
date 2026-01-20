/**
 * REPUTATION GATES CONFIGURATION
 * 
 * This file contains all the reputation point thresholds required for various actions
 * across the platform. Centralizing these values makes it easy to adjust the
 * community difficulty/quality curve.
 */

export const REPUTATION_GATES = {
    // Content Creation
    POST_LINK_OR_IMAGE: 10,   // Prevents brand new users from spamming links
    CREATE_POLL: 50,          // Ensures polls are created by established members
    CREATE_LOUNGE_THREAD: 200, // Quality filter for VIP areas (if not high_level)

    // Interactions
    DOWNVOTE: 100,            // Prevents "review bombing" / negativity from new accounts

    // Access
    VIP_LOUNGE_ACCESS: 500,   // Alternative to 'high_level' role for Lounge access
} as const;

export const BADGE_THRESHOLDS = {
    EARLY_ADOPTER_COUNT: 100, // First 100 users get "Early Adopter"
    TOP_CONTRIBUTOR_REP: 1000, // Rep needed for "Top Contributor" badge
    HELPFUL_HAND_COMMENTS: 50, // Comments needed for "Helpful Hand" (Concept)
} as const;
