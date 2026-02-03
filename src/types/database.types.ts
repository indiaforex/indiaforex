export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    reputation_points: number
                    role: 'guest' | 'user' | 'high_level' | 'admin' | 'moderator' | 'super_admin' | 'event_analyst'
                    is_banned: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    reputation_points?: number
                    role?: 'guest' | 'user' | 'high_level' | 'admin' | 'moderator' | 'super_admin' | 'event_analyst'
                    is_banned?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    reputation_points?: number
                    role?: 'guest' | 'user' | 'high_level' | 'admin' | 'moderator' | 'super_admin' | 'event_analyst'
                    is_banned?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            forum_threads: {
                Row: {
                    id: string
                    title: string
                    content: string
                    author_id: string
                    category: string
                    tags: string[] | null
                    likes_count: number
                    reply_count: number
                    is_pinned: boolean
                    is_locked: boolean
                    created_at: string
                    updated_at: string
                    last_activity_at: string
                    deleted_at: string | null
                    deleted_by: string | null
                    deletion_reason: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    author_id: string
                    category: string
                    tags?: string[] | null
                    likes_count?: number
                    reply_count?: number
                    is_pinned?: boolean
                    is_locked?: boolean
                    created_at?: string
                    updated_at?: string
                    last_activity_at?: string
                    deleted_at?: string | null
                    deleted_by?: string | null
                    deletion_reason?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    author_id?: string
                    category?: string
                    tags?: string[] | null
                    likes_count?: number
                    reply_count?: number
                    is_pinned?: boolean
                    is_locked?: boolean
                    created_at?: string
                    updated_at?: string
                    last_activity_at?: string
                    deleted_at?: string | null
                    deleted_by?: string | null
                    deletion_reason?: string | null
                }
                Relationships: []
            }
            forum_comments: {
                Row: {
                    id: string
                    thread_id: string
                    author_id: string
                    content: string
                    parent_id: string | null
                    likes_count: number
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                    deleted_by: string | null
                    deletion_reason: string | null
                }
                Insert: {
                    id?: string
                    thread_id: string
                    author_id: string
                    content: string
                    parent_id?: string | null
                    likes_count?: number
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                    deleted_by?: string | null
                    deletion_reason?: string | null
                }
                Update: {
                    id?: string
                    thread_id?: string
                    author_id?: string
                    content?: string
                    parent_id?: string | null
                    likes_count?: number
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                    deleted_by?: string | null
                    deletion_reason?: string | null
                }
                Relationships: []
            }
            forum_likes: {
                Row: {
                    user_id: string
                    thread_id: string | null
                    comment_id: string | null
                    created_at: string
                }
                Insert: {
                    user_id: string
                    thread_id?: string | null
                    comment_id?: string | null
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    thread_id?: string | null
                    comment_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            forum_polls: {
                Row: {
                    id: string
                    thread_id: string
                    question: string
                    options: Json
                    allow_multiple: boolean
                    status: 'active' | 'closed'
                    expires_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    thread_id: string
                    question: string
                    options: Json
                    allow_multiple?: boolean
                    status?: 'active' | 'closed'
                    expires_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    thread_id?: string
                    question?: string
                    options?: Json
                    allow_multiple?: boolean
                    status?: 'active' | 'closed'
                    expires_at?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            forum_poll_votes: {
                Row: {
                    id: string
                    poll_id: string
                    user_id: string
                    option_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    poll_id: string
                    user_id: string
                    option_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    poll_id?: string
                    user_id?: string
                    option_id?: string
                    created_at?: string
                }
                Relationships: []
            }
            forum_reports: {
                Row: {
                    id: string
                    reporter_id: string
                    target_type: 'thread' | 'comment'
                    target_id: string
                    reason: string
                    status: 'pending' | 'resolved' | 'dismissed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    reporter_id: string
                    target_type: 'thread' | 'comment'
                    target_id: string
                    reason: string
                    status?: 'pending' | 'resolved' | 'dismissed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    reporter_id?: string
                    target_type?: 'thread' | 'comment'
                    target_id?: string
                    reason?: string
                    status?: 'pending' | 'resolved' | 'dismissed'
                    created_at?: string
                }
                Relationships: []
            }
            admin_logs: {
                Row: {
                    id: string
                    admin_id: string
                    action: string
                    target_id: string | null
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    admin_id: string
                    action: string
                    target_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    admin_id?: string
                    action?: string
                    target_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
            forum_categories: {
                Row: {
                    slug: string
                    name: string
                    description: string | null
                    is_restricted: boolean
                    min_role: string
                    created_at: string
                }
                Insert: {
                    slug: string
                    name: string
                    description?: string | null
                    is_restricted?: boolean
                    min_role?: string
                    created_at?: string
                }
                Update: {
                    slug?: string
                    name?: string
                    description?: string | null
                    is_restricted?: boolean
                    min_role?: string
                    created_at?: string
                }
                Relationships: []
            }
            category_moderators: {
                Row: {
                    category_slug: string
                    user_id: string
                    assigned_by: string | null
                    assigned_at: string
                }
                Insert: {
                    category_slug: string
                    user_id: string
                    assigned_by?: string | null
                    assigned_at?: string
                }
                Update: {
                    category_slug?: string
                    user_id?: string
                    assigned_by?: string | null
                    assigned_at?: string
                }
                Relationships: []
            }
            badges: {
                Row: {
                    slug: string
                    name: string
                    icon_name: string
                    color: string
                    description: string | null
                }
                Insert: {
                    slug: string
                    name: string
                    icon_name: string
                    color: string
                    description?: string | null
                }
                Update: {
                    slug?: string
                    name?: string
                    icon_name?: string
                    color?: string
                    description?: string | null
                }
                Relationships: []
            }
            user_badges: {
                Row: {
                    user_id: string
                    badge_slug: string
                    awarded_at: string
                }
                Insert: {
                    user_id: string
                    badge_slug: string
                    awarded_at?: string
                }
                Update: {
                    user_id?: string
                    badge_slug?: string
                    awarded_at?: string
                }
                Relationships: []
            }
            forum_thread_views: {
                Row: {
                    user_id: string
                    thread_id: string
                    last_viewed_at: string
                }
                Insert: {
                    user_id: string
                    thread_id: string
                    last_viewed_at?: string
                }
                Update: {
                    user_id?: string
                    thread_id?: string
                    last_viewed_at?: string
                }
                Relationships: []
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    actor_id: string
                    type: 'reply_thread' | 'reply_comment' | 'mention' | 'like'
                    resource_id: string
                    resource_slug: string
                    content_preview: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    actor_id: string
                    type: 'reply_thread' | 'reply_comment' | 'mention' | 'like'
                    resource_id: string
                    resource_slug: string
                    content_preview?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    actor_id?: string
                    type?: 'reply_thread' | 'reply_comment' | 'mention' | 'like'
                    resource_id?: string
                    resource_slug?: string
                    content_preview?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            forum_bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    thread_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    thread_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    thread_id?: string
                    created_at?: string
                }
                Relationships: []
            },
            market_bets: {
                Row: {
                    id: string
                    user_id: string
                    market_id: string
                    direction: 'UP' | 'DOWN'
                    amount: number
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    market_id: string
                    direction: 'UP' | 'DOWN'
                    amount: number
                    status: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    market_id?: string
                    direction?: 'UP' | 'DOWN'
                    amount?: number
                    status?: string
                    created_at?: string
                }
                Relationships: []
            },
            user_alerts: {
                Row: {
                    id: string
                    user_id: string
                    symbol: string
                    condition: 'ABOVE' | 'BELOW'
                    target_price: number
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    symbol: string
                    condition: 'ABOVE' | 'BELOW'
                    target_price: number
                    status: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    symbol?: string
                    condition?: 'ABOVE' | 'BELOW'
                    target_price?: number
                    status?: string
                    created_at?: string
                }
                Relationships: []
            },
            achievements: {
                Row: {
                    id: string
                    slug: string
                    name: string
                    description: string
                    icon: string
                    xp_reward: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    name: string
                    description: string
                    icon: string
                    xp_reward: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    name?: string
                    description?: string
                    icon?: string
                    xp_reward?: number
                    created_at?: string
                }
                Relationships: []
            },
            user_achievements: {
                Row: {
                    user_id: string
                    achievement_id: string
                    unlocked_at: string
                }
                Insert: {
                    user_id: string
                    achievement_id: string
                    unlocked_at?: string
                }
                Update: {
                    user_id?: string
                    achievement_id?: string
                    unlocked_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_achievements_achievement_id_fkey"
                        columns: ["achievement_id"]
                        isOneToOne: false
                        referencedRelation: "achievements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_achievements_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            process_reputation_logs: {
                Args: Record<string, never>
                Returns: void
            },
            increment_comment_likes: {
                Args: { comment_id: string }
                Returns: void
            },
            decrement_comment_likes: {
                Args: { comment_id: string }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
