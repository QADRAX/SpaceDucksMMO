import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <nav className={cn('w-64 bg-darkBg text-darkText p-6 border-r-2 border-border', className)}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading">🦆 DAS Admin</h1>
      </div>
      {children}
    </nav>
  );
}

interface SidebarMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <ul className={cn('space-y-2', className)}>
      {children}
    </ul>
  );
}

interface SidebarMenuItemProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarMenuItem({ href, children, className }: SidebarMenuItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'block px-4 py-2 rounded-base hover:bg-secondaryBlack transition-colors text-darkText font-base border-2 border-transparent hover:border-border',
          className
        )}
      >
        {children}
      </Link>
    </li>
  );
}
