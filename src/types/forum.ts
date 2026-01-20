import { Database } from './database.types';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

export type UserRole = Tables<'profiles'>['role'];

export type Badge = Tables<'badges'>;

export interface UserBadge extends Tables<'user_badges'> {
    badge?: Badge; // Joined
}

export interface UserProfile extends Tables<'profiles'> {
    badges?: UserBadge[];
}

export type ForumCategory = Tables<'forum_categories'>;

export interface CategoryModerator extends Tables<'category_moderators'> {
    user?: UserProfile;
}

export interface ForumReport extends Tables<'forum_reports'> {
    reporter?: UserProfile;
}

export interface AdminLog extends Tables<'admin_logs'> {
    admin?: UserProfile;
}

export interface PollOption {
    id: string;
    label: string;
    votes: number;
}

export interface Poll extends Omit<Tables<'forum_polls'>, 'options'> {
    options: PollOption[];
    user_vote_ids?: string[]; // IDs of options the current user voted for (computed)
}

export interface ForumThread extends Tables<'forum_threads'> {
    author?: UserProfile; // Joined
    poll?: Poll; // Joined relation (Active)
    polls?: Poll[]; // All polls (History)
}

export interface ForumComment extends Tables<'forum_comments'> {
    author?: UserProfile; // Joined
    replies?: ForumComment[]; // For UI structure
}

