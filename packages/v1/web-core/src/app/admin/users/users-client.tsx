'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  sessionVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InviteRow = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  expiresAt: string;
  createdAt: string;
  claimedAt: string | null;
  createdByUserId: string;
  claimedByUserId: string | null;
};

type MeResponse = {
  user: null | { id: string; email: string; name: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' };
};

export function UsersClient({
  initialUsers,
  initialInvites,
}: {
  initialUsers: UserRow[];
  initialInvites: InviteRow[];
}) {
  const [me, setMe] = React.useState<MeResponse['user']>(null);
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers);
  const [invites, setInvites] = React.useState<InviteRow[]>(initialInvites);

  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'USER' | 'ADMIN'>('USER');
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: MeResponse) => setMe(data.user))
      .catch(() => null);
  }, []);

  async function refresh() {
    const [usersRes, invitesRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/users/invites'),
    ]);

    if (usersRes.ok) {
      const data = await usersRes.json().catch(() => null);
      if (Array.isArray(data?.data)) setUsers(data.data);
    }

    if (invitesRes.ok) {
      const data = await invitesRes.json().catch(() => null);
      if (Array.isArray(data?.data)) setInvites(data.data);
    }
  }

  async function onCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInviteUrl(null);

    try {
      const res = await fetch('/api/admin/users/invites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Failed to create invite';
        setError(message);
        return;
      }

      if (typeof data?.inviteUrl === 'string') {
        setInviteUrl(data.inviteUrl);
      }

      await refresh();

      setInviteName('');
      setInviteEmail('');
      setInviteRole('USER');
    } catch {
      setError('Failed to create invite');
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(userId: string, patch: { name?: string; role?: 'USER' | 'ADMIN'; isActive?: boolean }) {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Failed to update user';
        setError(message);
        return;
      }

      await refresh();
    } catch {
      setError('Failed to update user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="font-heading text-lg">Invite a new user</h2>
        <p className="text-sm text-neutral-600">
          This creates a disabled user plus an invitation URL (no email integration).
        </p>

        <form onSubmit={onCreateInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Name" />
          </div>
          <div className="md:col-span-2">
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" />
          </div>
          <div className="md:col-span-1 flex gap-2">
            <select
              className="border border-border rounded-base px-3 py-2 bg-bg text-sm flex-1"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'USER' | 'ADMIN')}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <Button type="submit" disabled={busy || inviteName.trim().length < 2 || !inviteEmail.includes('@')}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>

        {inviteUrl ? (
          <div className="text-sm">
            <div className="text-neutral-700">Invite URL:</div>
            <div className="mt-1 flex gap-2 items-center">
              <Input value={inviteUrl} readOnly />
              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(inviteUrl).catch(() => null);
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">Users</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <p className="text-neutral-600">No users.</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isMe = me?.id === u.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">{u.email}</code>
                    </TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>
                      {u.role === 'SUPER_ADMIN' ? (
                        <Badge variant="default">SUPER_ADMIN</Badge>
                      ) : u.role === 'ADMIN' ? (
                        <Badge variant="default">ADMIN</Badge>
                      ) : (
                        <Badge variant="secondary">USER</Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.isActive ? 'Active' : 'Invited'}</TableCell>
                    <TableCell>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <select
                          className="border border-border rounded-base px-2 py-1 bg-bg text-xs"
                          value={u.role === 'SUPER_ADMIN' ? 'ADMIN' : u.role}
                          disabled={busy || u.role === 'SUPER_ADMIN' || isMe}
                          onChange={(e) => patchUser(u.id, { role: e.target.value as 'USER' | 'ADMIN' })}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        <Button
                          type="button"
                          disabled={busy || isMe}
                          onClick={() => patchUser(u.id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>

                        {isMe ? <span className="text-xs text-neutral-500">(you)</span> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg">Recent invites</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-neutral-600">No invites.</p>
                </TableCell>
              </TableRow>
            ) : (
              invites.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">{inv.email}</code>
                  </TableCell>
                  <TableCell>{inv.name}</TableCell>
                  <TableCell>
                    <Badge variant={inv.role === 'ADMIN' ? 'default' : 'secondary'}>{inv.role}</Badge>
                  </TableCell>
                  <TableCell>{new Date(inv.expiresAt).toLocaleString()}</TableCell>
                  <TableCell>{inv.claimedAt ? 'Claimed' : 'Pending'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
