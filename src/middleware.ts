import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { ratelimit } from './lib/ratelimit';

/*
 * Global Middleware
 * Executed on the Edge (Vercel) before the request hits the Node.js API.
 */

export async function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        // Rate limiting disabled to prevent crashes with missing Upstash Env vars
        // If needed in future, ensure UPSTASH_REDIS_REST_URL is set.
        return NextResponse.next();
    }

    return NextResponse.next();
}

// Config: Match only API routes to avoid running on Static Assets
export const config = {
    matcher: '/api/:path*',
};
