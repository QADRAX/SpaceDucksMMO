import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import {
  createAuthJwt,
  getAuthCookieName,
  getDefaultAuthMaxAgeSeconds,
  getJwtSecret,
  hashPassword,
} from '@/lib/auth';
import { z } from 'zod';

const SetupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(10).max(200),
  })
  .strict();

export async function POST(request: NextRequest) {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return NextResponse.json({ error: 'Already initialized' }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      sessionVersion: true,
    },
  });

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

  return res;
}
