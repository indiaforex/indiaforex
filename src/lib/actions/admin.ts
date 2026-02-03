'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { QUEUE_NAMES } from '@/lib/queue';

export type AdminLogAction = 'BAN_USER' | 'UNBAN_USER' | 'UPDATE_ROLE' | 'DELETE_CONTENT' | 'RESOLVE_REPORT' | 'CREATE_MARKET' | 'ADD_EVENT';

// Helper to log admin actions
export async function logAdminAction(
    action: AdminLogAction,
    targetId: string | null,
    details: any
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action,
        target_id: targetId,
        details
    });
}

// Check if current user is admin/super_admin
export async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin' || profile?.role === 'super_admin';
}

export async function verifySuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'super_admin';
}

// --- USER MANAGEMENT ---

export async function getUsers(page = 1, limit = 20, search = '') {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (search) {
        query = query.ilike('username', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
    }

    return { users: data, total: count || 0 };
}

export async function updateUserRole(userId: string, newRole: 'user' | 'moderator' | 'admin' | 'super_admin' | 'event_analyst') {
    const isSuper = await verifySuperAdmin();
    if (!isSuper) throw new Error('Unauthorized: Only Super Admin can change roles');

    const supabase = await createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) throw new Error(error.message);

    await logAdminAction('UPDATE_ROLE', userId, { newRole });
    revalidatePath('/admin/users');
    return { success: true };
}

export async function toggleUserBan(userId: string, currentStatus: boolean, reason?: string) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();

    // Prevent banning super_admins
    const { data: target } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (target?.role === 'super_admin') {
        throw new Error('Cannot ban a Super Admin');
    }

    const newStatus = !currentStatus;

    const { error } = await supabase
        .from('profiles')
        .update({ is_banned: newStatus })
        .eq('id', userId);

    if (error) throw new Error(error.message);

    await logAdminAction(newStatus ? 'BAN_USER' : 'UNBAN_USER', userId, { reason });
    revalidatePath('/admin/users');
    return { success: true };
}

// --- MODERATION ---

export async function getReports(page = 1, limit = 20) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch reports with basic info
    const { data: reports, error, count } = await supabase
        .from('forum_reports')
        .select(`
            *,
            reporter:reporter_id(username)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    // For each report, fetch the content preview if possible
    const enrichedReports = await Promise.all(reports.map(async (r) => {
        let contentPreview = 'Content deleted or not found';

        if (r.target_type === 'thread') {
            const { data } = await supabase.from('forum_threads').select('title, content').eq('id', r.target_id).single();
            if (data) contentPreview = `[Thread] ${data.title}: ${data.content.substring(0, 50)}...`;
        } else if (r.target_type === 'comment') {
            const { data } = await supabase.from('forum_comments').select('content').eq('id', r.target_id).single();
            if (data) contentPreview = `[Comment] ${data.content.substring(0, 50)}...`;
        }

        return { ...r, content_preview: contentPreview };
    }));

    return { reports: enrichedReports, total: count || 0 };
}

export async function resolveReport(reportId: string, resolution: 'resolved' | 'dismissed', actionTaken?: string) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();

    const { error } = await supabase
        .from('forum_reports')
        .update({ status: resolution })
        .eq('id', reportId);

    if (error) throw new Error(error.message);

    await logAdminAction('RESOLVE_REPORT', reportId, { resolution, actionTaken });
    revalidatePath('/admin/moderation');
    return { success: true };
}

export async function deleteReportedContent(reportId: string, targetType: 'thread' | 'comment', targetId: string) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();

    // 1. Delete the content
    let error;
    if (targetType === 'thread') {
        const { error: e } = await supabase.from('forum_threads').delete().eq('id', targetId);
        error = e;
    } else {
        const { error: e } = await supabase.from('forum_comments').delete().eq('id', targetId);
        error = e;
    }

    if (error) throw new Error(`Failed to delete content: ${error.message}`);

    // 2. Mark report as resolved (Content Removed)
    await supabase
        .from('forum_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

    await logAdminAction('DELETE_CONTENT', targetId, { reportId, type: targetType });
    revalidatePath('/admin/moderation');
    return { success: true };
}


// --- SYSTEM HEALTH ---

export async function getSystemHealth() {
    const isAdmin = await verifySuperAdmin(); // Restrict to Super Admin
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();

    // 1. Database Check
    const startDb = Date.now();
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const dbLatency = Date.now() - startDb;

    // 2. Redis/Queue Check
    const queues = [
        { name: 'Gamification', key: QUEUE_NAMES.ENGAGEMENT }, // Using ENGAGEMENT for gamification related tasks
        { name: 'Backtest', key: QUEUE_NAMES.COMPUTE }, // Using COMPUTE for backtest
        { name: 'Market Data', key: QUEUE_NAMES.MARKET_DATA }
    ];

    const queueMetrics = await Promise.all(queues.map(async (q) => {
        try {
            const queue = new Queue(q.key, { connection: redisConnection });
            const counts = await queue.getJobCounts('active', 'completed', 'failed', 'delayed');
            await queue.close();
            return { name: q.name, status: 'online', counts };
        } catch (e) {
            return { name: q.name, status: 'offline', error: 'Connection failed' };
        }
    }));

    // 3. Simple Redis Ping
    let redisStatus = 'offline';
    let redisLatency = 0;
    try {
        const startRedis = Date.now();
        await redisConnection.ping();
        redisLatency = Date.now() - startRedis;
        redisStatus = 'online';
    } catch (e) {
        console.error("Redis Ping Failed", e);
    }

    return {
        database: { status: dbError ? 'error' : 'online', latency: dbLatency, error: dbError?.message },
        redis: { status: redisStatus, latency: redisLatency },
        queues: queueMetrics,
        lastUpdated: new Date().toISOString()
    };
}

// --- LOGS ---

export async function getAdminLogs(page = 1, limit = 50) {
    const isAdmin = await verifySuperAdmin(); // Logs are sensitive
    if (!isAdmin) throw new Error('Unauthorized');

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: logs, error, count } = await supabase
        .from('admin_logs')
        .select(`
            *,
            admin:admin_id(username)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);

    return { logs, total: count || 0 };
}
