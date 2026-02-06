import * as React from 'react';
import Link from 'next/link';

import { RESOURCE_GROUPS, getKindLabel } from '@/lib/resourceGroups';
import { cn } from '@/lib/utils';

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-base border-2 border-transparent px-2 py-1 text-sm font-bold text-black hover:border-black hover:bg-main',
        className
      )}
    >
      {children}
    </Link>
  );
}

function TreeSection({
  title,
  defaultOpen,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-base px-2 py-1 font-black hover:bg-bg">
        <span className="flex items-center gap-2">{title}</span>
        <span className="text-xs opacity-70 group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="ml-3 mt-1 border-l-2 border-black pl-3 space-y-1">{children}</div>
    </details>
  );
}

export function AdminNavTree({ showUsers }: { showUsers: boolean }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <NavLink href="/admin">
          <span className="text-base">▣</span>
          Dashboard
        </NavLink>
      </div>

      <TreeSection
        title={
          <>
            <span className="text-base">▦</span>
            Resources
          </>
        }
        defaultOpen
      >
        <NavLink href="/admin/resources">All resources</NavLink>

        {RESOURCE_GROUPS.map((group) => (
          <TreeSection key={group.id} title={<>{group.label}</>} defaultOpen={group.id === 'materials'}>
            <NavLink href={`/admin/resources/group/${group.id}`}>All {group.label.toLowerCase()}</NavLink>
            {group.kinds.map((kind) => (
              <NavLink
                key={kind}
                href={`/admin/resources/group/${group.id}/${kind}`}
                className="pl-1"
              >
                {getKindLabel(group, kind)}
              </NavLink>
            ))}
          </TreeSection>
        ))}
      </TreeSection>

      <div className="space-y-1">
        <NavLink href="/admin/scenes">
          <span className="text-base">▧</span>
          Scenes
        </NavLink>

        {showUsers ? (
          <NavLink href="/admin/users">
            <span className="text-base">▩</span>
            Users
          </NavLink>
        ) : null}

        <NavLink href="/api-docs">
          <span className="text-base">▤</span>
          API Docs
        </NavLink>

        <NavLink href="/api/auth/logout">
          <span className="text-base">⎋</span>
          Logout
        </NavLink>
      </div>
    </div>
  );
}
