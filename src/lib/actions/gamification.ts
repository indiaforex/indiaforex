'use server';

import { getTopUsers, getUserRank } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

export async function fetchLeaderboard() {
    const topUsers = await getTopUsers(10);
    return topUsers;
}

export async function fetchUserRank() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const rank = await getUserRank(user.id);
    return rank;
}

export async function fetchUserAchievements(userId?: string) {
    const supabase = await createClient();

    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)') // Nested select to get achievement details
        .eq('user_id', targetUserId);

    return data || [];
}
