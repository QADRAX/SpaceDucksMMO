import { NextRequest, NextResponse } from 'next/server';
import { verifyBasicAuth, createUnauthorizedResponse } from './lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires authentication
  const requiresAuth = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (requiresAuth) {
    const authHeader = request.headers.get('authorization');
    const isValid = verifyBasicAuth(authHeader);

    if (!isValid) {
      return createUnauthorizedResponse();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
