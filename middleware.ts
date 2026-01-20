import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // Removed unused dependency
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // 1. Update Supabase session (handles token refresh)
    const response = await updateSession(request);

    // 2. Supabase Admin Check (Optional - Page level check is also present)
    /* 
    const supabase = createClient(request, response);
    const { data: { user } } = await supabase.auth.getUser();
    if (request.nextUrl.pathname.startsWith('/admin') && !user) {
         return NextResponse.redirect(new URL('/login', request.url));
    }
    */
    // For now relying on page-level protection to avoid double-instantiation cost in middleware unless critical.

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
