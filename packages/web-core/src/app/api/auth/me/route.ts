import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getAuthCookieName, getJwtSecret, verifyAuthJwt } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getAuthCookieName())?.value ?? null;
  const payload = await verifyAuthJwt(token, getJwtSecret());
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
