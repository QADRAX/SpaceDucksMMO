import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <nav className={cn('w-72 bg-white border-r-4 border-black p-8', className)}>
      <div className="mb-10">
        <div className="bg-main border-4 border-black p-4 rounded-base shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-black uppercase tracking-tight">Duck Engine</h1>
          <p className="text-xs font-bold mt-1 opacity-70">Assets Service</p>
        </div>
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
          'block px-5 py-3 rounded-base font-bold text-black border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] bg-white hover:bg-main',
          className
        )}
      >
        {children}
      </Link>
    </li>
  );
}
