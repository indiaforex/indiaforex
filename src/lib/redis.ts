import { Redis as IORedis } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

// 1. Standard TCP Redis Client for BullMQ (Worker/Queue)
// BullMQ requires a persistent connection, so we use ioredis.
// If REDIS_URL is strictly provided, we use it.
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn("WARN: REDIS_URL is not defined. Queue features will fail.");
}

// Singleton pattern to avoid too many connections in dev HMR
export const redisConnection = new IORedis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
});

// 2. HTTP Redis Client for Rate Limiting & Ephemeral State
// Upstash's HTTP client is serverless friendly (stateless).
// It works perfectly for Middlewares and Edge Functions where TCP is hard.
export const upstashRedis = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/*
 * Implementation Note:
 * We use TWO different clients because of the Deployment Target (Vercel).
 * Vercel Serverless Functions hate persistent TCP connections (ioredis can timeout).
 * So for standard "Get/Set" from the UI, we use Upstash HTTP.
 * For the "Worker" process (which runs separately on Railway/EC2), we use ioredis.
 */

// Helper: Fetch latest price from Redis (used by Workers)
export async function getLatestPrice(symbol: string): Promise<number | null> {
    try {
        const price = await redisConnection.get(`PRICE:${symbol}`);
        return price ? parseFloat(price) : null;
    } catch (e) {
        console.error(`Error fetching price for ${symbol}:`, e);
        return null;
    }
}
