"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { processMentions } from "@/lib/notifications";
import { logAdminAction } from "@/lib/moderation";

export async function createComment(threadId: string, content: string, parentId?: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // 1. Insert Comment
    const { data: newComment, error } = await supabase
        .from('forum_comments')
        .insert({
            thread_id: threadId,
            content,
            author_id: user.id,
            parent_id: parentId || null
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // 2. Handle Mentions Logic
    // Use shared helper
    await processMentions(content, newComment.id, 'comment', user.id, threadId);

    // 3. Global Revalidation
    revalidatePath(`/forum/${threadId}`);
    revalidatePath('/forum'); // Update index numbers
    revalidatePath('/'); // Update dashboard highlights
    revalidatePath(`/u/${user.user_metadata?.username || ''}`); // Update profile stats

    return { success: true };
}

export async function deleteComment(commentId: string, threadId: string, reason: string = 'User deleted') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify ownership or Admin status
    const { data: comment } = await supabase
        .from('forum_comments')
        .select('author_id')
        .eq('id', commentId)
        .single();

    if (!comment) throw new Error("Comment not found");

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    if (comment.author_id !== user.id && !isAdmin) {
        throw new Error("Unauthorized to delete this comment");
    }

    // Soft Delete
    const { error } = await supabase
        .from('forum_comments')
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            deletion_reason: reason
        })
        .eq('id', commentId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/forum/${threadId}`);
    revalidatePath('/forum');
    revalidatePath('/');

    // Log if Admin deleted someone else's comment
    if (isAdmin && comment.author_id !== user.id) {
        await logAdminAction(user.id, 'delete_comment', commentId, { reason, threadId, authorId: comment.author_id });
    }

    return { success: true };
}


export async function updateComment(commentId: string, content: string, threadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('forum_comments')
        .update({ content })
        .eq('id', commentId)
        .eq('author_id', user.id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath(`/forum/${threadId}`);
    return { success: true };
}

export async function toggleLikeComment(commentId: string, threadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('forum_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

    if (existingLike) {
        // Unlike
        await supabase
            .from('forum_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('comment_id', commentId);

        // Decrement count manually (no RPC)
        const { data: current } = await supabase.from('forum_comments').select('likes_count').eq('id', commentId).single();
        if (current) {
            await supabase.from('forum_comments').update({ likes_count: Math.max(0, (current.likes_count || 0) - 1) }).eq('id', commentId);
        }

    } else {
        // Like
        await supabase
            .from('forum_likes')
            .insert({
                user_id: user.id,
                comment_id: commentId
            });

        // Increment count manually
        const { data: current } = await supabase.from('forum_comments').select('likes_count').eq('id', commentId).single();
        if (current) {
            await supabase.from('forum_comments').update({ likes_count: (current.likes_count || 0) + 1 }).eq('id', commentId);
        }
    }

    revalidatePath(`/forum/${threadId}`);

    return { success: true, liked: !existingLike };
}

export async function toggleThreadLike(threadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check if already liked
    const { data: existingLike } = await supabase
        .from('forum_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('thread_id', threadId)
        .single();

    if (existingLike) {
        // Unlike
        await supabase.from('forum_likes').delete().eq('user_id', user.id).eq('thread_id', threadId);

        // Manual decrement
        const { data: current } = await supabase.from('forum_threads').select('likes_count').eq('id', threadId).single();
        if (current) {
            await supabase.from('forum_threads').update({ likes_count: Math.max(0, (current.likes_count || 0) - 1) }).eq('id', threadId);
        }
    } else {
        // Like
        await supabase.from('forum_likes').insert({ user_id: user.id, thread_id: threadId });

        // Manual increment
        const { data: current } = await supabase.from('forum_threads').select('likes_count').eq('id', threadId).single();
        if (current) {
            await supabase.from('forum_threads').update({ likes_count: (current.likes_count || 0) + 1 }).eq('id', threadId);
        }
    }

    revalidatePath(`/forum/${threadId}`);
    revalidatePath('/forum');
    revalidatePath('/');

    return { success: true, liked: !existingLike };
}

import { getComments } from "@/lib/forum";

export async function fetchMoreComments(threadId: string, page: number) {
    const { comments, total } = await getComments(threadId, page);
    return { comments, total };
}
