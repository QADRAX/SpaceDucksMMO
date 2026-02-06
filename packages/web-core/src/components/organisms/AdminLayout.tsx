import * as React from 'react';
import { cookies } from 'next/headers';

import { Sidebar, SidebarMenu, SidebarMenuItem } from './Sidebar';
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem href="/admin">
            <span className="flex items-center gap-3">
              <span className="text-lg">▣</span>
              Dashboard
            </span>
          </SidebarMenuItem>
          <SidebarMenuItem href="/admin/materials">
            <span className="flex items-center gap-3">
              <span className="text-lg">▦</span>
              Materials
            </span>
          </SidebarMenuItem>
          <SidebarMenuItem href="/admin/scenes">
            <span className="flex items-center gap-3">
              <span className="text-lg">▧</span>
              Scenes
            </span>
          </SidebarMenuItem>

          {showUsers ? (
            <SidebarMenuItem href="/admin/users">
              <span className="flex items-center gap-3">
                <span className="text-lg">▩</span>
                Users
              </span>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem href="/api-docs">
            <span className="flex items-center gap-3">
              <span className="text-lg">▤</span>
              API Docs
            </span>
          </SidebarMenuItem>
          <SidebarMenuItem href="/api/auth/logout">
            <span className="flex items-center gap-3">
              <span className="text-lg">⎋</span>
              Logout
            </span>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <main className={cn('flex-1 p-8', className)}>
        {children}
      </main>
    </div>
  );
}
