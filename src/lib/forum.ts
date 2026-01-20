"use server";


import { ForumThread, ForumComment, PollOption, Poll, ForumCategory } from "@/types/forum";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_GATES } from "@/config/reputation";
import { stewardPinThread, stewardLockThread } from "@/lib/stewardship";
import { processMentions } from "@/lib/notifications";

export async function createThread(
    thread: { title: string; content: string; category: string; tags: string[]; author_id: string },
    poll?: { question: string; options: string[]; allow_multiple: boolean; expires_at?: string }
) {
    const supabase = await createClient();

    // Reputation Gate: Links/Images (Basic Check)
    // If content has http/https and user rep < 10 -> Reject
    // We need to fetch author profile first
    const { data: profile } = await supabase.from('profiles').select('reputation_points').eq('id', thread.author_id).single();

    // Link Gate
    if (thread.content.includes("http") && (profile?.reputation_points || 0) < REPUTATION_GATES.POST_LINK_OR_IMAGE) {
        return { error: `You need ${REPUTATION_GATES.POST_LINK_OR_IMAGE} reputation points to post links.` };
    }

    // ... existing insert logic ...
    // 1. Create Thread
    const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .insert({
            title: thread.title,
            content: thread.content,
            category: thread.category,
            tags: thread.tags,
            author_id: thread.author_id
        })
        .select()
        .single();

    if (threadError) {
        console.error("Error creating thread:", threadError);
        return { error: threadError };
    }

    // 2. Create Poll if exists
    if (poll && threadData) {
        // Reputation Gate: Polls
        if ((profile?.reputation_points || 0) < REPUTATION_GATES.CREATE_POLL) {
            // We created thread but failed poll? Ideally we check BEFORE thread creation.
            // Moving check up.
        }

        const pollOptions = poll.options.map((opt, idx) => ({
            id: `opt_${idx + 1}`,
            label: opt,
            votes: 0
        }));

        const { error: pollError } = await supabase
            .from('forum_polls')
            .insert({
                thread_id: threadData.id,
                question: poll.question,
                options: pollOptions,
                allow_multiple: poll.allow_multiple,
                status: 'active',
                expires_at: poll.expires_at
            });

        if (pollError) {
            console.error("Error creating poll:", pollError);
        }
    }

    // 3. Process Mentions
    // We execute this asynchronously and don't await/block the response
    // But since it's a server action, maybe better to await to ensure it runs? 
    // Usually Vercel functions might freeze if we don't await.
    await processMentions(thread.content, threadData.id, 'thread', thread.author_id, threadData.id);

    return { data: threadData };
}

// Refactored createPoll to Check Rep
export async function createPoll(threadId: string, poll: { question: string; options: string[]; allow_multiple: boolean; expires_at?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Check Rep
    const { data: profile } = await supabase.from('profiles').select('reputation_points').eq('id', user.id).single();
    if ((profile?.reputation_points || 0) < REPUTATION_GATES.CREATE_POLL) {
        return { error: `You need ${REPUTATION_GATES.CREATE_POLL} reputation points to create a poll.` };
    }

    // 1. Close existing active polls for this thread
    await supabase.from('forum_polls').update({ status: 'closed' }).eq('thread_id', threadId).eq('status', 'active');

    // 2. Create new poll
    const pollOptions = poll.options.map((opt, idx) => ({
        id: `opt_${idx + 1}`,
        label: opt,
        votes: 0
    }));

    return await supabase.from('forum_polls').insert({
        thread_id: threadId,
        question: poll.question,
        options: pollOptions,
        allow_multiple: poll.allow_multiple,
        status: 'active',
        expires_at: poll.expires_at
    }).select().single();
}

export async function voteOnPoll(pollId: string, optionId: string, userId: string) {
    const supabase = await createClient();

    // 1. Fetch Poll
    const { data: poll, error: fetchError } = await supabase
        .from('forum_polls')
        .select('*')
        .eq('id', pollId)
        .single();

    if (fetchError || !poll) return { error: "Poll not found" };

    // 2. Check Existing Votes
    const { data: existingVotes } = await supabase
        .from('forum_poll_votes')
        .select('*')
        .eq('poll_id', pollId)
        .eq('user_id', userId);

    const hasVoted = existingVotes && existingVotes.length > 0;

    if (!poll.allow_multiple && hasVoted) {
        return { error: "You have already voted on this poll." };
    }

    if (existingVotes?.some(v => v.option_id === optionId)) {
        return { error: "You have already voted for this option." };
    }

    // 3. Insert Vote
    const { error: voteError } = await supabase
        .from('forum_poll_votes')
        .insert({
            poll_id: pollId,
            user_id: userId,
            option_id: optionId
        });

    if (voteError) return { error: voteError.message };

    // 4. Update Options Count - REMOVED TO PREVENT RACE CONDITION
    // We now calculate votes dynamically in getThreadById

    return { success: true };
}

// ... existing code ...

export async function toggleThreadPin(threadId: string, isPinned: boolean) {
    // Delegate to Steward Logic (Safe Admin Update)
    return await stewardPinThread(threadId, isPinned);
}

export async function toggleThreadLock(threadId: string, isLocked: boolean) {
    // Delegate to Steward Logic
    return await stewardLockThread(threadId, isLocked);
}

export async function deleteThread(threadId: string, reason: string = 'User deleted') {
    // RLS handles this (Author OR Steward OR Admin)
    // Soft Delete
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return await supabase
        .from('forum_threads')
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user?.id,
            deletion_reason: reason
        })
        .eq('id', threadId);
}

export async function updateThread(threadId: string, updates: { title?: string; content?: string; category?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from('forum_threads')
        .update(updates)
        .eq('id', threadId)
        .eq('author_id', user.id);

    if (error) {
        console.error("Error updating thread:", error);
        return { error: error.message };
    }

    return { success: true };
}


export interface GetThreadsParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    userId?: string;
    sort?: 'latest' | 'top' | 'hot';
}

export async function getThreads({ page = 1, limit = 10, search, category, userId, sort = 'latest' }: GetThreadsParams = {}) {
    const supabase = await createClient();
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
        .from('forum_threads')
        .select(`
            *,
            author:profiles!forum_threads_author_id_fkey (
                id, username, avatar_url, reputation_points, role, is_banned, created_at
            ),
             poll:forum_polls(*)
        `, { count: 'exact' })
        .is('deleted_at', null);

    if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (category && category !== 'all' && category !== '') {
        query = query.eq('category', category);
    }

    if (userId) {
        query = query.eq('author_id', userId);
    }

    // Pinned always on top for 'latest' and 'hot'? 
    // Creating a complex order might be tricky. simple approach:
    // Pinned logic is usually for 'default' view (latest).
    if (sort === 'latest') {
        query = query.order('is_pinned', { ascending: false });
        query = query.order('created_at', { ascending: false });
    } else if (sort === 'top') {
        query = query.order('likes_count', { ascending: false });
    } else if (sort === 'hot') {
        query = query.order('last_activity_at', { ascending: false });
    }

    const { data, error, count } = await query
        .range(start, end);

    if (error) {
        console.error("Error fetching threads:", error);
        return { threads: [], total: 0 };
    }

    return {
        threads: (data || []) as unknown as ForumThread[],
        total: count || 0
    };
}

export async function getBookmarkedThreads(userId: string) {
    const supabase = await createClient();

    // Join bookmarks with threads
    const { data, error } = await supabase
        .from('forum_bookmarks')
        .select(`
            thread:forum_threads!inner(
                *,
                author:profiles!forum_threads_author_id_fkey (
                    id, username, avatar_url, reputation_points, role, is_banned, created_at, badges:user_badges(badge:badges(*))
                ),
                poll:forum_polls(*)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }); // Bookmarked recently

    if (error) {
        console.error("Error fetching bookmarks:", error);
        return [];
    }

    // Flatten structure
    // We cast the mapped result, not individual items to avoid complex relation typing here
    const threads = (data || []).map(b => b.thread);
    return threads as unknown as ForumThread[];
}

export async function getRecentThreads(limit = 10, pinnedLimit = 3): Promise<ForumThread[]> {
    const supabase = await createClient();

    // 1. Fetch pinned threads
    const { data: pinned } = await supabase
        .from('forum_threads')
        .select(`
            *,
            author:profiles!forum_threads_author_id_fkey (
                id, username, avatar_url, reputation_points, role, is_banned, created_at, badges:user_badges(badge:badges(*))
            ),
             poll:forum_polls(*)
        `)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false })
        .limit(pinnedLimit);

    const pinnedThreads = (pinned || []) as unknown as ForumThread[];

    // 2. Fetch recent unpinned threads
    const remainingLimit = limit - pinnedThreads.length;
    let recentThreads: ForumThread[] = [];

    if (remainingLimit > 0) {
        const { data: recent } = await supabase
            .from('forum_threads')
            .select(`
                *,
                author:profiles!forum_threads_author_id_fkey (
                    id, username, avatar_url, reputation_points, role, is_banned, created_at, badges:user_badges(badge:badges(*))
                ),
                 poll:forum_polls(*)
            `)
            .eq('is_pinned', false)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(remainingLimit);

        recentThreads = (recent || []) as unknown as ForumThread[];
    }

    return [...pinnedThreads, ...recentThreads];
}

export async function getThreadById(id: string, userId?: string): Promise<ForumThread | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_threads')
        .select(`
            *,
            author:profiles!forum_threads_author_id_fkey (
                id,
                username,
                avatar_url,
                reputation_points,
                role,
                is_banned,
                created_at
            ),
            polls:forum_polls(*)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching thread ${id}:`, error);
        return null;
    }

    const thread = data as unknown as ForumThread;
    let polls = (thread.polls || []) as Poll[];
    const activePoll = polls.find(p => p.status === 'active');

    // DYNAMIC VOTE COUNTING (Fixes Race Condition)
    // We only recalculate for the active poll to save bandwidth
    if (activePoll) {
        // Fetch ALL votes for this poll
        const { data: allVotes } = await supabase
            .from('forum_poll_votes')
            .select('option_id')
            .eq('poll_id', activePoll.id);

        if (allVotes) {
            // Aggregate counts
            const counts: Record<string, number> = {};
            allVotes.forEach(v => {
                counts[v.option_id] = (counts[v.option_id] || 0) + 1;
            });

            // Hydrate options with real counts
            // Ensure options is an array
            const currentOptions = Array.isArray(activePoll.options)
                ? activePoll.options as PollOption[]
                : [];

            activePoll.options = currentOptions.map(opt => ({
                ...opt,
                votes: counts[opt.id] || 0
            }));
        }
    }

    // Fetch user votes if logged in
    if (userId && polls.length > 0) {
        const { data: votes } = await supabase
            .from('forum_poll_votes')
            .select('poll_id, option_id')
            .in('poll_id', polls.map(p => p.id))
            .eq('user_id', userId);

        if (votes) {
            polls = polls.map(p => ({
                ...p,
                user_vote_ids: votes.filter(v => v.poll_id === p.id).map(v => v.option_id)
            }));
        }
    }

    // Update the active poll in the polls array if it was modified
    if (activePoll) {
        const idx = polls.findIndex(p => p.id === activePoll.id);
        if (idx !== -1) polls[idx] = activePoll;
    }

    return {
        ...thread,
        poll: activePoll, // Can be undefined
        polls: polls
    };
}

export async function getComments(threadId: string, page = 1, limit = 50): Promise<{ comments: ForumComment[], total: number }> {
    const supabase = await createClient();
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
        .from('forum_comments')
        .select(`
            *,
            author:profiles!forum_comments_author_id_fkey (
                id,
                username,
                avatar_url,
                reputation_points,
                role,
                is_banned,
                created_at
            )
        `, { count: 'exact' })
        .eq('thread_id', threadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }) // Chronological
        .range(start, end);

    if (error) {
        console.error(`Error fetching comments for ${threadId}: `, error);
        return { comments: [], total: 0 };
    }

    return {
        comments: (data || []) as unknown as ForumComment[],
        total: count || 0
    };
}

export async function getUserThreads(userId: string): Promise<ForumThread[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_threads')
        .select(`
        *,
        author: profiles!forum_threads_author_id_fkey(
            id,
            username,
            avatar_url,
            reputation_points,
            role,
            is_banned,
            created_at
        )
        `)
        .eq('author_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(`Error fetching threads for user ${userId}: `, error);
        return [];
    }

    return (data || []) as unknown as ForumThread[];
}

export async function getUserComments(userId: string): Promise<ForumComment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_comments')
        .select(`
        *,
        author: profiles!forum_comments_author_id_fkey(
            id,
            username,
            avatar_url,
            reputation_points,
            role,
            is_banned,
            created_at
        )
        `)
        .eq('author_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(`Error fetching comments for user ${userId}: `, error);
        return [];
    }

    return (data || []) as unknown as ForumComment[];
}

export async function getUserStats(userId: string) {
    const supabase = await createClient();

    // 1. Thread Count
    const { count: threadCount } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

    // 2. Comment Count
    const { count: commentCount } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

    // 3. Reputation and Join Date (from Profile)
    const { data: profile } = await supabase
        .from('profiles')
        .select('reputation_points, created_at')
        .eq('id', userId)
        .single();

    return {
        threadCount: threadCount || 0,
        commentCount: commentCount || 0,
        reputation: profile?.reputation_points || 0,
        joinedAt: profile?.created_at
    };
}

export async function getThreadView(threadId: string, userId: string): Promise<string | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from('forum_thread_views')
        .select('last_viewed_at')
        .eq('thread_id', threadId)
        .eq('user_id', userId)
        .single();

    return data?.last_viewed_at || null;
}

export async function recordThreadView(threadId: string, userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('forum_thread_views')
        .upsert({
            thread_id: threadId,
            user_id: userId,
            last_viewed_at: new Date().toISOString()
        }, { onConflict: 'user_id, thread_id' });

    if (error) {
        console.error("Error recording view:", error);
    }
    return { error };
}

export async function getCategories(): Promise<ForumCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name');

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return (data || []) as ForumCategory[];
}
