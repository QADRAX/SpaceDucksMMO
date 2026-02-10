import * as React from 'react';
import { cookies } from 'next/headers';

import { Sidebar } from './Sidebar';
import { AdminNavTree } from './AdminNavTree';
import { cn } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { getAuthCookieName, getJwtSecret, verifyAuthJwt } from '@/lib/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export async function AdminLayout({ children, className }: AdminLayoutProps) {
  // Note: `proxy.ts` enforces RBAC at the edge. This check only hides/show menu items.
  const cookieStore = await cookies();
  const token = cookieStore.get(getAuthCookieName())?.value ?? null;
  const payload = await verifyAuthJwt(token, getJwtSecret());

  let showUsers = false;
  if (payload) {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { role: true, isActive: true, sessionVersion: true },
    });

    showUsers = Boolean(user) && user!.isActive && user!.sessionVersion === payload.sv && user!.role === 'SUPER_ADMIN';
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar className="h-screen overflow-auto">
        <AdminNavTree showUsers={showUsers} />
      </Sidebar>
      <main className={cn('flex-1 p-8 min-w-0 min-h-0 overflow-hidden', className)}>
        {children}
      </main>
    </div>
  );
}
