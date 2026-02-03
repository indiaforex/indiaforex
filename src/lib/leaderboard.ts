import { upstashRedis } from "./redis";
import { createClient } from "./supabase/server";

const LEADERBOARD_KEY = "leaderboard:reputation";

export type LeaderboardEntry = {
    userId: string;
    username: string;
    avatarUrl: string;
    score: number;
    rank: number;
}

export async function updateLeaderboard(userId: string, newScore: number) {
    // ZADD adds or updates the score of a member in a sorted set
    // TC: O(log(N))
    await upstashRedis.zadd(LEADERBOARD_KEY, { score: newScore, member: userId });
}

export async function getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    // ZREVRANGE returns the specified range of elements in the sorted set stored at key, rev order
    // We get [userId, score, userId, score] flat array from some clients, but Upstash SDK might return objects depending on config.
    // Upstash's zrange with { withScores: true } returns objects { member, score }

    const topUsersWithScores = await upstashRedis.zrange(LEADERBOARD_KEY, 0, limit - 1, {
        rev: true,
        withScores: true
    });

    if (!topUsersWithScores.length) return [];

    const userIds = topUsersWithScores.map((u: any) => u.member as string);

    // Fetch user details from Supabase
    // Ideally we cache this too, but for MVB this is fine
    const supabase = await createClient();
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]));

    return topUsersWithScores.map((entry: any, index: number) => {
        const profile = profileMap.get(entry.member as string);
        return {
            userId: entry.member as string,
            username: profile?.username || 'Unknown Trader',
            avatarUrl: profile?.avatar_url || '',
            score: entry.score,
            rank: index + 1
        };
    });
}


export async function getUserRank(userId: string): Promise<number | null> {
    const rank = await upstashRedis.zrevrank(LEADERBOARD_KEY, userId);
    return rank !== null ? rank + 1 : null; // 0-indexed to 1-indexed
}
