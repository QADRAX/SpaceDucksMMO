import * as React from 'react';
import { Sidebar, SidebarMenu, SidebarMenuItem } from './Sidebar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem href="/admin">Dashboard</SidebarMenuItem>
          <SidebarMenuItem href="/admin/assets">Assets</SidebarMenuItem>
          <SidebarMenuItem href="/api-docs">📖 API Docs</SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <main className={cn('flex-1 p-8 bg-bg', className)}>
        {children}
      </main>
    </div>
  );
}
