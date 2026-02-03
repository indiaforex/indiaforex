import { AppQueue, QUEUE_NAMES } from '../lib/queue';
import 'dotenv/config'; // Make sure env vars are loaded
import { config } from 'dotenv';
import path from 'path';

// Explicit load for script execution
config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('🚀 Kickstarting HIGH-FREQUENCY Feed (10s)...');

    // Single Batch Job that handles all 30+ symbols inside the worker
    console.log(`Scheduling 10-second BATCH sync 'sync-all'...`);

    await AppQueue.dispatch(
        QUEUE_NAMES.MARKET_DATA,
        'sync-all', // Matches the new processor logic
        { action: 'sync-all' }, // payload
        {
            repeat: { every: 10 * 1000 },
            jobId: `sync:batch:10s` // Unique ID (diff from 1m to force update)
        }
    );

    console.log('✅ Done! The worker will now fetch all symbols every 10 seconds.');
    console.log('NOTE: Run clear-queue.ts first to remove old 1-minute jobs.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
