import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ratelimit } from './lib/ratelimit';

/*
 * Global Middleware
 * Executed on the Edge (Vercel) before the request hits the Node.js API.
 */

export async function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (request.nextUrl.pathname.startsWith('/api')) {

        // Exclude internal Cron/Worker routes if any (Add logic here later)
        if (request.nextUrl.pathname.startsWith('/api/cron')) {
            return NextResponse.next();
        }

        // Identify User: Use "X-Forwarded-For" (Real IP) or "127.0.0.1" (Dev)
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';

        // TODO: Extract User ID from Session for 'ratelimit.user' tier
        // For now, treat everyone as Guest via IP
        const { success, limit, reset, remaining } = await ratelimit.guest.limit(ip);

        // Add Headers (Good Citizenship)
        const res = success
            ? NextResponse.next()
            : NextResponse.json(
                { error: 'Too Many Requests', retryAfter: new Date(reset).toISOString() },
                { status: 429 }
            );

        res.headers.set('X-RateLimit-Limit', limit.toString());
        res.headers.set('X-RateLimit-Remaining', remaining.toString());
        res.headers.set('X-RateLimit-Reset', reset.toString());

        return res;
    }

    return NextResponse.next();
}

// Config: Match only API routes to avoid running on Static Assets
export const config = {
    matcher: '/api/:path*',
};
