
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Load env vars FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    console.log("🚀 Triggering Test Gamification Event...");

    // 2. Dynamic Import queue AFTER env vars are loaded
    // This ensures redis.ts sees the correct REDIS_URL
    const { AppQueue, QUEUE_NAMES } = await import('../src/lib/queue');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase keys in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get a Test User
    const { data: users, error } = await supabase.from('profiles').select('id, username').limit(1);

    if (error || !users || users.length === 0) {
        console.error("❌ No users found to test with. Please sign up first.");
        process.exit(1);
    }

    const testUser = users[0];
    console.log(`👤 Testing with user: ${testUser.username} (${testUser.id})`);

    // 2. Dispatch a Fake 'BET_SETTLED' Event
    await AppQueue.dispatch(QUEUE_NAMES.ENGAGEMENT, 'test-gamification', {
        type: 'BET_SETTLED',
        userId: testUser.id,
        details: {
            won: true,
            amount: 500 // Mock amount
        }
    });

    console.log("✅ Job dispatched to 'engagement-queue'.");
    console.log("👉 Check your worker terminal for processing logs.");
    console.log("👉 Check the user's profile for the 'First Blood' badge.");

    // Wait a bit to ensure redis flushes
    await new Promise(r => setTimeout(r, 1000));
    process.exit(0);
}

main().catch(console.error);
