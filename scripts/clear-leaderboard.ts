
import dotenv from 'dotenv';
import path from 'path';

// Load env vars before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearLeaderboard() {
    // Dynamic import to ensure env vars are loaded first
    const { upstashRedis } = await import("@/lib/redis");

    console.log("Clearing 'leaderboard:reputation'...");
    await upstashRedis.del("leaderboard:reputation");
    console.log("Done. The leaderboard is now empty. New actions (bets, logins) will repopulate it.");
}

clearLeaderboard();

