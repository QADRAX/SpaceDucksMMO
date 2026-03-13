/**
 * GET /api/auth/logout
 *
 * Clears the admin session cookie and redirects to /login.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthCookieName } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', request.url));

  res.cookies.set({
    name: getAuthCookieName(),
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return res;
}
