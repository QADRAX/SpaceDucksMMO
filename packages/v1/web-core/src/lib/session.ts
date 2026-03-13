import type { NextRequest } from 'next/server';

import { prisma } from '@/lib/db';
import { getAuthCookieName, getJwtSecret, verifyAuthJwt } from '@/lib/auth';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  sessionVersion: number;
};

function roleRank(role: SessionUser['role']): number {
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

export function roleAtLeast(role: SessionUser['role'], required: SessionUser['role']): boolean {
  return roleRank(role) >= roleRank(required);
}

export async function getSessionUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(getAuthCookieName())?.value ?? null;
  const payload = await verifyAuthJwt(token, getJwtSecret());
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!user || !user.isActive) return null;
  if (user.sessionVersion !== payload.sv) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role'],
    sessionVersion: user.sessionVersion,
  };
}
