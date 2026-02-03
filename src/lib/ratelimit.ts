import { Ratelimit } from '@upstash/ratelimit';
import { upstashRedis } from './redis';

/*
 * Module 2: Distributed Rate Limiting
 * Uses Redis to track request counts across serverless functions.
 */

// 1. Define Limiters
// Cost: Ephemeral (Slides every 10s or 60s)

export const ratelimit = {
    // Strict limit for public APIs (Guests)
    // 10 requests every 10 seconds.
    guest: new Ratelimit({
        redis: upstashRedis,
        analytics: true,
        prefix: 'ratelimit:guest',
        limiter: Ratelimit.slidingWindow(10, '10 s'),
    }),

    // Relaxed limit for Authenticated Users (Future use with Auth)
    // 100 requests every 1 minute.
    user: new Ratelimit({
        redis: upstashRedis,
        analytics: true,
        prefix: 'ratelimit:user',
        limiter: Ratelimit.slidingWindow(100, '60 s'),
    }),

    // Internal/Worker limit (High throughput)
    worker: new Ratelimit({
        redis: upstashRedis,
        analytics: false,
        prefix: 'ratelimit:worker',
        limiter: Ratelimit.tokenBucket(1000, '1 s', 1000),
    })
};
