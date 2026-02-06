import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import {
  getAuthCookieName,
  getJwtSecret,
  verifyAuthJwt,
} from './lib/auth';

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

function roleRank(role: Role): number {
  switch (role) {
    case 'SUPER_ADMIN':
      return 3;
    case 'ADMIN':
      return 2;
    case 'USER':
    default:
      return 1;
  }
}

function roleAtLeast(role: Role, required: Role): boolean {
  return roleRank(role) >= roleRank(required);
}

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
    const existingCount = await prisma.user.count();
    if (existingCount === 0) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Setup required' }, { status: 503 });
      }

      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      const url = request.nextUrl.clone();
      url.pathname = '/setup';
      url.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(url);
    }

    const token = request.cookies.get(getAuthCookieName())?.value ?? null;
    const payload = await verifyAuthJwt(token, getJwtSecret());

    if (!payload) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('returnTo', returnTo);
      return NextResponse.redirect(url);
    }

    // If authenticated via JWT, validate user is still active and enforce RBAC.
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true, sessionVersion: true },
      });

      const valid =
        Boolean(user) &&
        user!.isActive &&
        user!.sessionVersion === payload.sv;

      if (!valid) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const returnTo = request.nextUrl.pathname + request.nextUrl.search;
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('returnTo', returnTo);
        return NextResponse.redirect(url);
      }

      const requiredRole: Role = pathname.startsWith('/admin/users') || pathname.startsWith('/api/admin/users')
        ? 'SUPER_ADMIN'
        : 'ADMIN';

      if (!roleAtLeast(user!.role as Role, requiredRole)) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
