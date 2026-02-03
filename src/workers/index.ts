import 'dotenv/config'; // Load .env
import { config } from 'dotenv';
import path from 'path';

// Explicitly load .env.local because dotenv/config only loads .env by default
config({ path: path.resolve(process.cwd(), '.env.local') });

import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis';
import { QUEUE_NAMES } from '../lib/queue';

console.log("[Worker] Redis URL configured as:", process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:\/\/.*@/, '://***@') : "UNDEFINED (Using Localhost?)");
console.log("[Worker] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING");

import { marketProcessor } from './processors/market';
import { settlementProcessor } from './processors/settlement';
import { alertsProcessor } from './processors/alerts';
import { backtestProcessor } from './processors/backtest';
import gamificationProcessor from './processors/gamification';

/*
 * The Worker Process Entrypoint (Optimization Edition)
 * 
 * CHANGE: Market Data Feed now runs on a local `setInterval` loop.
 * REASON: BullMQ polling consumes excessive Redis commands on Upstash Free Tier.
 * A simple 10s loop costs 0 Redis commands to schedule.
 */

console.log('🚀 Starting "Project Titan" Worker Cluster (Optimized)...');

// 1. Market Feed Loop (10s)
const FEED_INTERVAL_MS = 10 * 1000; // 10 Seconds

const runMarketLoop = async () => {
    try {
        // Construct a Mock Job object (or refactor processor to not need one)
        // Here we just pass the data payload as the processor expects job.data
        const mockJob: any = { data: { action: 'sync-all' }, name: 'force-sync' };

        // Execute Processor
        await marketProcessor(mockJob);

    } catch (err) {
        console.error("Market Loop Error:", err);
    }
};

// 2. Settlement Loop (Every 1 Hour)
// Checks for yesterday's markets to settle.
const SETTLEMENT_INTERVAL_MS = 60 * 60 * 1000;

const runSettlementLoop = async () => {
    try {
        await settlementProcessor();
    } catch (err) {
        console.error("Settlement Loop Error:", err);
    }
};

// Start Loops
// Start Loops
// (Initialization moved to 'A. Init Workers' section below to avoid duplication)

// 3. Alerts Loop (Every 1 Minute)
// Checks active user alerts against latest redis prices.
const ALERTS_INTERVAL_MS = 60 * 1000;

const runAlertsLoop = async () => {
    try {
        await alertsProcessor();
    } catch (err) {
        console.error("Alerts Loop Error:", err);
    }
};

// --- INIT WORKERS ---

// A. Start Loops
console.log(`[Worker] Starting Market Loop (${FEED_INTERVAL_MS}ms)...`);
setInterval(runMarketLoop, FEED_INTERVAL_MS);

console.log(`[Worker] Starting Alerts Loop (${ALERTS_INTERVAL_MS}ms)...`);
setInterval(runAlertsLoop, ALERTS_INTERVAL_MS);

// Run immediately via setImmediate to not wait 10s for first run
setImmediate(runMarketLoop);
setImmediate(runAlertsLoop);

// Start Settlement Loop (1h)
console.log(`[System] Starting Settlement Engine (1h)`);
runSettlementLoop(); // Run once on start
setInterval(runSettlementLoop, SETTLEMENT_INTERVAL_MS);


// B. Start BullMQ Processors (Jobs)
// Backtest Queue
const backtestWorker = new Worker(QUEUE_NAMES.COMPUTE, backtestProcessor, {
    connection: redisConnection,
    concurrency: 2 // Allow 2 concurrent backtests
});

backtestWorker.on('completed', (job) => {
    console.log(`[Backtest] Job ${job.id} completed!`);
});

backtestWorker.on('failed', (job, err) => {
    console.error(`[Backtest] Job ${job?.id} failed:`, err);
});


// Engagement Worker (Kept for Phase 3 Async Tasks)
// We keep this active because these are USER triggered events, not infinite loops.
// However, to save further costs, we can increase connection lock duration or use a pause.
const engagementWorker = new Worker(QUEUE_NAMES.ENGAGEMENT, gamificationProcessor, {
    connection: redisConnection,
    // Reduce polling aggression
    drainDelay: 5000
});

engagementWorker.on('active', (job) => {
    console.log(`[Engagement] Job ${job.id} active: ${job.name}`);
});

engagementWorker.on('completed', (job) => {
    console.log(`[Engagement] Job ${job.id} completed!`);
});

engagementWorker.on('failed', (job, err) => {
    console.error(`[Engagement] Job ${job?.id} failed: ${err.message}`);
});

engagementWorker.on('error', (err) => {
    console.error(`[Engagement] Worker Error: ${err.message}`);
});

// 4. Compute Worker (ALREADY INITIALIZED AS backtestWorker ABOVE)
// Removing duplicate declaration which was causing double processing/connections.

console.log(`
Worker Status:
- Market Feed: ACTIVE (Local Interval Mode)
- Alerts Monitor: ACTIVE (1m Interval)
- Compute Eng: LISTENING (Backtests)
- Engagement: LISTENING (Low Polling)
- Redis Connection: ACTIVE
`);

// Graceful Shutdown
const gracefulShutdown = async () => {
    console.log('SIGTERM received. Closing workers...');
    await engagementWorker.close();
    await backtestWorker.close();
    await redisConnection.quit();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
