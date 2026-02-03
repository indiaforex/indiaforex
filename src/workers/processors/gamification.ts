import { Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { updateLeaderboard } from "@/lib/leaderboard";

// Triggers for Gamification
type GamificationJobData = {
    type: 'BET_SETTLED' | 'DAILY_LOGIN';
    userId: string;
    details?: any; // e.g. amount won, login streak
}

export default async function gamificationProcessor(job: Job<GamificationJobData>) {
    console.log(`[GamificationProcessor] ENTERING with Job: ${job.name} (ID: ${job.id})`);
    const { type, userId, details } = job.data;

    // WORKER FIX: Use Service Role Key for background processing (No Cookies/Session)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[Gamification] Processing ${type} for ${userId}`);

    try {
        // 1. Always update leaderboard on significant reputation changes
        if (type === 'BET_SETTLED') {
            // Fetch latest reputation
            const { data: profile } = await supabase
                .from('profiles')
                .select('reputation_points')
                .eq('id', userId)
                .single();

            if (profile) {
                await updateLeaderboard(userId, profile.reputation_points);
            }

            // Check for First Win Achievement
            if (details?.won) {
                await checkAndGrantAchievement(userId, 'first_win', supabase);
            }
        }
    } catch (error) {
        console.error(`[Gamification] Error processing job ${job.id}:`, error);
        throw error;
    }
}

async function checkAndGrantAchievement(userId: string, slug: string, supabase: any) {
    // Get Achievement ID
    const { data: achievement } = await supabase
        .from('achievements')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!achievement) return;

    // Check if user has it
    const { data: hasIt } = await supabase
        .from('user_achievements')
        .select('unlocked_at')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .single();

    if (hasIt) return;

    // Grant it
    await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id
    });

    console.log(`[Gamification] Granted ${slug} to ${userId}`);
}
