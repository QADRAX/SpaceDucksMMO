/**
 * POST /api/auth/login
 *
 * Authenticates a local User and sets an HttpOnly JWT cookie.
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  createAuthJwt,
  getAuthCookieName,
  getDefaultAuthMaxAgeSeconds,
  getJwtSecret,
  verifyPassword,
} from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const identifier = typeof body?.email === 'string' ? body.email : (typeof body?.username === 'string' ? body.username : '');
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const existingCount = await prisma.user.count();
  if (existingCount === 0) {
    return NextResponse.json({ error: 'Setup required' }, { status: 409 });
  }

  const email = identifier.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
      sessionVersion: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const maxAgeSeconds = getDefaultAuthMaxAgeSeconds();
  const iat = Math.floor(Date.now() / 1000);

  const token = await createAuthJwt(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sv: user.sessionVersion,
      iat,
      exp: iat + maxAgeSeconds,
    },
    getJwtSecret()
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAuthCookieName(),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });

  await prisma.user
    .update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    })
    .catch(() => null);

  return res;
}
