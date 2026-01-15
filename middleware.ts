import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // 1. Update Supabase session (handles token refresh)
    const response = await updateSession(request);

    // 2. Existing NextAuth Admin Check
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Return the response prepared by updateSession (which preserves cookies)
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/auth (next-auth api routes, though supabase might need some too)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
    ],
};
