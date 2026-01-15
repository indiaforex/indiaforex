import { ForumThread, ForumComment } from "@/types/forum";
import { createClient } from "@/lib/supabase/server";

export async function getRecentThreads(): Promise<ForumThread[]> {
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
                created_at
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching threads:", JSON.stringify(error, null, 2));
        return [];
    }

    // Cast the joined data to match our ForumThread interface
    // Supabase returns 'author' as an array or object depending on relation type, here 1:1 so object.
    return data as unknown as ForumThread[];
}

export async function getThreadById(id: string): Promise<ForumThread | null> {
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
                created_at
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching thread ${id}:`, error);
        return null;
    }

    return data as unknown as ForumThread;
}

export async function getComments(threadId: string): Promise<ForumComment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_comments')
        .select(`
            *,
            author:profiles!forum_comments_author_id_fkey (
                id,
                username,
                avatar_url,
                reputation_points,
                role,
                created_at
            )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true }); // Chronological for traditional forum

    if (error) {
        console.error(`Error fetching comments for ${threadId}:`, error);
        return [];
    }

    return data as unknown as ForumComment[];
}

export async function getUserThreads(userId: string): Promise<ForumThread[]> {
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
                created_at
            )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(`Error fetching threads for user ${userId}:`, error);
        return [];
    }

    return data as unknown as ForumThread[];
}

export async function getUserComments(userId: string): Promise<ForumComment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('forum_comments')
        .select(`
            *,
            author:profiles!forum_comments_author_id_fkey (
                id,
                username,
                avatar_url,
                reputation_points,
                role,
                created_at
            )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(`Error fetching comments for user ${userId}:`, error);
        return [];
    }

    return data as unknown as ForumComment[];
}
