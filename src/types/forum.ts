export type UserRole = 'guest' | 'user' | 'high_level' | 'admin' | 'moderator' | 'super_admin' | 'event_analyst';

export interface Badge {
    slug: string;
    name: string;
    icon_name: string;
    color: string;
    description?: string;
}

export interface UserBadge {
    user_id: string;
    badge_slug: string;
    awarded_at: string;
    badge?: Badge; // Joined
}

export interface UserProfile {
    id: string; // references auth.users
    username: string;
    avatar_url?: string;
    reputation_points: number;
    role: UserRole;
    is_banned?: boolean;
    created_at: string;
    badges?: UserBadge[];
}

export interface ForumCategory {
    slug: string;
    name: string;
    description?: string;
    is_restricted: boolean;
    min_role?: string;
}

export interface CategoryModerator {
    category_slug: string;
    user_id: string;
    user?: UserProfile;
    assigned_by?: string;
    assigned_at: string;
}

export interface ForumReport {
    id: string;
    reporter_id: string;
    reporter?: UserProfile;
    target_type: 'thread' | 'comment';
    target_id: string;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
}

export interface AdminLog {
    id: string;
    admin_id: string;
    admin?: UserProfile;
    action: string;
    target_id?: string;
    details?: any;
    created_at: string;
}

export interface ForumThread {
    id: string;
    title: string;
    content: string; // Rich text or markdown
    author_id: string;
    author?: UserProfile; // Joined
    category: string;
    tags: string[];
    likes_count: number;
    reply_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    last_activity_at: string;
    poll?: Poll; // Joined relation (Active)
    polls?: Poll[]; // All polls (History)
}

export interface ForumComment {
    id: string;
    thread_id: string;
    author_id: string;
    author?: UserProfile; // Joined
    content: string;
    parent_id?: string | null; // For nested replies
    likes_count: number;
    created_at: string;
    updated_at: string;
    replies?: ForumComment[]; // For UI structure
}

export interface PollOption {
    id: string;
    label: string;
    votes: number;
}

export interface Poll {
    id: string;
    thread_id: string;
    question: string;
    options: PollOption[];
    allow_multiple: boolean;
    status: 'active' | 'closed';
    expires_at?: string;
    created_at: string;
    user_vote_ids?: string[]; // IDs of options the current user voted for (computed)
}
