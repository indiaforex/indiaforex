"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REPUTATION_GATES } from "@/config/reputation";

// --- Stewardship Checks ---

export async function isSteward(categorySlug: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // 1. Check if Global Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role === 'admin' || profile?.role === 'super_admin') return true;

    // 2. Check if Assigned Steward
    const { count } = await supabase
        .from('category_moderators')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category_slug', categorySlug);

    return !!count && count > 0;
}

export async function canAccessLounge(categorySlug: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await createClient();

    // Check if restricted
    const { data: category } = await supabase
        .from('forum_categories')
        .select('is_restricted, min_role')
        .eq('slug', categorySlug)
        .single();

    if (!category?.is_restricted) return { allowed: true };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: false, reason: "Login required" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, reputation_points, is_banned')
        .eq('id', user.id)
        .single();

    if (profile?.is_banned) return { allowed: false, reason: "Banned" };
    if (profile?.role === 'admin' || profile?.role === 'super_admin') return { allowed: true };

    // Check Role
    if (category.min_role === 'high_level' && profile?.role !== 'high_level') {
        // Fallback to Reputation Gate?
        if (profile?.reputation_points && profile.reputation_points >= REPUTATION_GATES.VIP_LOUNGE_ACCESS) {
            return { allowed: true };
        }
        return { allowed: false, reason: "Requires High Level status or 500+ Reputation" };
    }

    return { allowed: true };
}

// --- Steward Actions (Bypassing RLS safely) ---

export async function stewardPinThread(threadId: string, isPinned: boolean) {
    // 1. Verify Permission
    const supabase = await createClient();
    const { data: thread } = await supabase.from('forum_threads').select('category').eq('id', threadId).single();
    if (!thread) return { error: "Thread not found" };

    if (!(await isSteward(thread.category))) {
        return { error: "Unauthorized: You are not a steward of this category" };
    }

    // 2. Perform Action (Update is_pinned which RLS might block for stewards)
    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('forum_threads')
        .update({ is_pinned: isPinned })
        .eq('id', threadId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function stewardLockThread(threadId: string, isLocked: boolean) {
    // 1. Verify Permission
    const supabase = await createClient();
    const { data: thread } = await supabase.from('forum_threads').select('category').eq('id', threadId).single();
    if (!thread) return { error: "Thread not found" };

    if (!(await isSteward(thread.category))) {
        return { error: "Unauthorized" };
    }

    // 2. Perform Action
    const adminClient = createAdminClient();
    const { error } = await adminClient
        .from('forum_threads')
        .update({ is_locked: isLocked })
        .eq('id', threadId);

    if (error) return { error: error.message };
    return { success: true };
}

// --- Steward Management (Admin Only) ---

export async function assignSteward(categorySlug: string, userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return { error: "Forbidden" };

    const { error } = await supabase.from('category_moderators').insert({
        category_slug: categorySlug,
        user_id: userId,
        assigned_by: user.id
    });

    if (!error) {
        await supabase.from('admin_logs').insert({
            admin_id: user.id,
            action: 'assign_steward',
            target_id: userId,
            details: { category: categorySlug }
        });
    }

    return { error: error?.message, success: !error };
}

export async function removeSteward(categorySlug: string, userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') return { error: "Forbidden" };

    const { error } = await supabase.from('category_moderators')
        .delete()
        .eq('category_slug', categorySlug)
        .eq('user_id', userId);

    if (!error) {
        await supabase.from('admin_logs').insert({
            admin_id: user.id,
            action: 'remove_steward',
            target_id: userId,
            details: { category: categorySlug }
        });
    }

    return { error: error?.message, success: !error };
}

export async function getStewards(categorySlug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('category_moderators')
        .select(`
            *,
            user:profiles!category_moderators_user_id_fkey(*)
        `)
        .eq('category_slug', categorySlug);

    if (error) console.error("Error fetching stewards:", error);
    return data || [];
}
