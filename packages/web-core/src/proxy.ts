import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getSessionCookieName,
  getSessionSecret,
  verifyAdminSessionToken,
  verifyBasicAuth,
} from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires authentication
  const requiresAuth = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // Allow unauthenticated access to the login page.
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // Allow auth endpoints.
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (requiresAuth) {
    const authHeader = request.headers.get('authorization');

    // 1) Prefer cookie-based sessions for browsers.
    const sessionToken = request.cookies.get(getSessionCookieName())?.value ?? null;
    const session = await verifyAdminSessionToken(sessionToken, getSessionSecret());

    // 2) Keep Basic Auth working for curl/CLI.
    const basicOk = verifyBasicAuth(authHeader);

    const isValid = Boolean(session) || basicOk;

    if (!isValid) {
      // For API requests, return a JSON 401 without WWW-Authenticate to avoid browser prompts.
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For admin pages, redirect to an app-controlled login screen.
      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
