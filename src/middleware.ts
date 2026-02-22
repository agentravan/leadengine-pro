import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl.clone();

    // If user is not logged in and trying to access protected routes, redirect to home
    if (!session && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin'))) {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // If user is logged in, check their role in the profile table
    if (session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        // Protect /admin route
        if (url.pathname.startsWith('/admin') && profile?.role !== 'admin') {
            url.pathname = '/dashboard';
            url.searchParams.set('error', 'access_denied');
            return NextResponse.redirect(url);
        }
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
