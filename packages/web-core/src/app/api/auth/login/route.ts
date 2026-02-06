/**
 * POST /api/auth/login
 *
 * Sets an HttpOnly session cookie for the Admin UI.
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  createAdminSessionToken,
  getSessionCookieName,
  getSessionSecret,
  verifyAdminCredentials,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username/password' }, { status: 400 });
  }

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const now = Date.now();
  const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

  const token = await createAdminSessionToken(
    {
      u: username,
      iat: now,
      exp: now + maxAgeSeconds * 1000,
    },
    getSessionSecret()
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });

  return res;
}
