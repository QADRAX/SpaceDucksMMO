import * as React from 'react';
import { Sidebar, SidebarMenu, SidebarMenuItem } from './Sidebar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
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
          <SidebarMenuItem href="/admin/assets">
            <span className="flex items-center gap-3">
              <span className="text-lg">▦</span>
              Assets
            </span>
          </SidebarMenuItem>
          <SidebarMenuItem href="/api-docs">
            <span className="flex items-center gap-3">
              <span className="text-lg">▤</span>
              API Docs
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
