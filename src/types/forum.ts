export type UserRole = 'guest' | 'user' | 'high_level' | 'admin' | 'moderator';

export interface UserProfile {
    id: string; // references auth.users
    username: string;
    avatar_url?: string;
    reputation_points: number;
    role: UserRole;
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
    poll_id?: string;
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
    question: string;
    options: PollOption[];
    allow_multiple: boolean;
    expires_at?: string;
    created_at: string;
}
