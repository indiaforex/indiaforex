import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../lib/queue';
import { redisConnection } from '../lib/redis';
import 'dotenv/config';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('🧹 Clearing Market Queue Schedules...');

    const queue = new Queue(QUEUE_NAMES.MARKET_DATA, { connection: redisConnection });

    // Get all repeatable jobs
    const repeatableJobs = await queue.getRepeatableJobs();
    console.log(`Found ${repeatableJobs.length} repeatable jobs.`);

    for (const job of repeatableJobs) {
        console.log(`Removing job: ${job.name} (Key: ${job.key})`);
        await queue.removeRepeatableByKey(job.key);
    }

    // Also obliterate the queue content to be safe (optional, but good for clean slate)
    await queue.drain();
    console.log('🗑️  Drained waiting jobs.');

    console.log('✅ Queue Cleaned! Now run start-feed.ts to schedule the SINGLE batch job.');

    await queue.close();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
