"use server";

import { createClient } from "@/lib/supabase/server";
import { AdminLog, ForumReport, UserProfile } from "@/types/forum";

// --- Helpers ---

async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        throw new Error("Forbidden: Admin access required");
    }

    return { user, supabase };
}

export async function logAdminAction(adminId: string, action: string, targetId?: string, details?: any) {
    const supabase = await createClient();
    await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action,
        target_id: targetId,
        details
    });
}

// --- Reporting ---

export async function reportContent(targetType: 'thread' | 'comment', targetId: string, reason: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.from('forum_reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason
    });

    if (error) {
        console.error("Error reporting content:", error);
        return { error: "Failed to submit report" };
    }

    return { success: true };
}

export async function getReports(status: 'pending' | 'resolved' | 'dismissed' = 'pending'): Promise<ForumReport[]> {
    try {
        const { supabase } = await ensureAdmin();

        const { data, error } = await supabase
            .from('forum_reports')
            .select(`
                *,
                reporter:profiles!forum_reports_reporter_id_fkey (*)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as ForumReport[];
    } catch (e: any) {
        console.error("Error fetching reports:", e);
        return [];
    }
}

export async function resolveReport(reportId: string, outcome: 'resolved' | 'dismissed') {
    try {
        const { user, supabase } = await ensureAdmin();

        const { error } = await supabase
            .from('forum_reports')
            .update({ status: outcome })
            .eq('id', reportId);

        if (error) throw error;

        await logAdminAction(user.id, 'resolve_report', reportId, { outcome });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

// --- User Management ---

export async function banUser(targetUserId: string) {
    try {
        const { user, supabase } = await ensureAdmin();

        // Check actor role
        const { data: actorProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const actorRole = actorProfile?.role;

        // Check target role
        const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', targetUserId).single();
        const targetRole = targetProfile?.role;

        if (!targetProfile) throw new Error("User not found");
        if (user.id === targetUserId) throw new Error("You cannot ban yourself");

        // Hierarchy Rules
        if (actorRole === 'admin') {
            if (targetRole === 'admin' || targetRole === 'super_admin') {
                throw new Error("Admins cannot ban other Admins or Super Admins");
            }
        }
        // Super Admin can ban anyone except themselves (handled above)

        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', targetUserId);

        if (error) throw error;

        await logAdminAction(user.id, 'ban_user', targetUserId, { targetRole });
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function unbanUser(targetUserId: string) {
    try {
        const { user, supabase } = await ensureAdmin();

        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: false })
            .eq('id', targetUserId);

        if (error) throw error;

        await logAdminAction(user.id, 'unban_user', targetUserId);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getUsers(search?: string): Promise<UserProfile[]> {
    try {
        const { supabase } = await ensureAdmin();

        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // Pagination needed for real app

        if (search) {
            query = query.ilike('username', `%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data as UserProfile[];
    } catch (e: any) {
        console.error("Error fetching users:", e);
        return [];
    }
}

export async function getAdminLogs(): Promise<AdminLog[]> {
    try {
        const { supabase, user } = await ensureAdmin();

        // Get current user role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const isSuperAdmin = profile?.role === 'super_admin';

        let query = supabase
            .from('admin_logs')
            .select(`
                *,
                admin:profiles!admin_logs_admin_id_fkey (username, role, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!isSuperAdmin) {
            // Regular admins should NOT see Super Admin actions? or maybe just their own?
            // "hide the ones super_admin deleted from other admins"
            // We need to filter based on the Role of the admin_id in the log. 
            // However, we can't join-filter easily in one go without a view or complex query.
            // EASIER: Filter in application layer for MVP, or better:
            // "admins can see only admin logs" -> WHERE admin_id's role != super_admin

            // Actually, we can fetch the logs, and if the associated admin has role 'super_admin', filter it out.
            // But we are selecting *, admin:profiles...
            // Let's rely on the returned data structure.
        }

        const { data, error } = await query;
        if (error) throw error;

        let logs = data as unknown as AdminLog[];

        if (!isSuperAdmin) {
            // Filter: Remove logs where the actor (admin) is a super_admin
            logs = logs.filter((log: any) => log.admin?.role !== 'super_admin');
        }

        return logs;
    } catch (e) {
        console.error("Error fetching logs:", e);
        return [];
    }
}

// --- Content Moderation ---

export async function adminDeleteContent(targetType: 'thread' | 'comment', targetId: string) {
    try {
        const { user, supabase } = await ensureAdmin();

        const table = targetType === 'thread' ? 'forum_threads' : 'forum_comments';

        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', targetId);

        if (error) throw error;

        await logAdminAction(user.id, `delete_${targetType}`, targetId);
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function banReportTargetAuthor(reportId: string) {
    try {
        const { user, supabase } = await ensureAdmin();

        // 1. Fetch report to get target info
        const { data: report, error: reportError } = await supabase
            .from('forum_reports')
            .select('target_type, target_id')
            .eq('id', reportId)
            .single();

        if (reportError || !report) throw new Error("Report not found");

        // 2. Fetch author of the target
        const table = (report.target_type === 'thread' ? 'forum_threads' : 'forum_comments') as 'forum_threads' | 'forum_comments';
        const { data: target, error: targetError } = await supabase
            .from(table)
            .select('author_id')
            .eq('id', report.target_id)
            .single();

        if (targetError || !target) throw new Error("Target content not found");

        // 3. Ban the user
        const targetUserId = target.author_id;
        const { error: banError } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', targetUserId);

        if (banError) throw banError;

        await logAdminAction(user.id, 'ban_user_via_report', targetUserId, { reportId });
        return { success: true };
    } catch (e: any) {
        console.error("Error banning target author:", e);
        return { error: e.message };
    }
}
