import { Queue } from 'bullmq';
import { redisConnection } from './redis';

/*
 * The "Event Bus" for Project Titan.
 * This file defines the Queues that the application can write to.
 */

// Define Queue Names Constant
export const QUEUE_NAMES = {
    MARKET_DATA: 'market-data-queue',
    ENGAGEMENT: 'engagement-queue',   // For Notifications, Betting
    COMPUTE: 'compute-queue',         // For Backtesting, Arbitrage calc
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Singleton Queue Instances (Producer side)
// We lazy-load them to prevent connection attempts during build time
let marketQueue: Queue | null = null;
let engagementQueue: Queue | null = null;
let computeQueue: Queue | null = null;

const getMarketQueue = () => {
    if (!marketQueue) {
        marketQueue = new Queue(QUEUE_NAMES.MARKET_DATA, { connection: redisConnection });
    }
    return marketQueue;
};

const getEngagementQueue = () => {
    if (!engagementQueue) {
        engagementQueue = new Queue(QUEUE_NAMES.ENGAGEMENT, { connection: redisConnection });
    }
    return engagementQueue;
};

const getComputeQueue = () => {
    if (!computeQueue) {
        computeQueue = new Queue(QUEUE_NAMES.COMPUTE, { connection: redisConnection });
    }
    return computeQueue;
};

/**
 * AppQueue: The primary interface for dispatching background jobs.
 * Usage: await AppQueue.dispatch('market-data-queue', 'sync-symbol', { symbol: 'USDINR' });
 */
export class AppQueue {
    static async dispatch(
        queueName: QueueName,
        jobName: string,
        data: any,
        options?: { delay?: number; jobId?: string; repeat?: { every: number } }
    ) {
        let queue: Queue;

        switch (queueName) {
            case QUEUE_NAMES.MARKET_DATA:
                queue = getMarketQueue();
                break;
            case QUEUE_NAMES.ENGAGEMENT:
                queue = getEngagementQueue();
                break;
            case QUEUE_NAMES.COMPUTE:
                queue = getComputeQueue();
                break;
            default:
                throw new Error(`Unknown queue: ${queueName}`);
        }

        return queue.add(jobName, data, options);
    }

    /**
     * Gracefully close all queues. Useful for shutdown signals.
     */
    static async closeAll() {
        if (marketQueue) await marketQueue.close();
        if (engagementQueue) await engagementQueue.close();
        if (computeQueue) await computeQueue.close();
    }
}
