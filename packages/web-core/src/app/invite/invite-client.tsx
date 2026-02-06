'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { PageHeader } from '@/components/organisms/PageHeader';

type InvitePublic = {
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  expiresAt: string;
};

export function InviteClient({ token }: { token: string }) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [invite, setInvite] = React.useState<InvitePublic | null>(null);
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!token) {
        setInvite(null);
        setLoading(false);
        setError('Missing invite token');
        return;
      }

      try {
        const res = await fetch(`/api/auth/invite/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message = typeof data?.error === 'string' ? data.error : 'Invalid invite';
          if (!cancelled) {
            setInvite(null);
            setError(message);
          }
          return;
        }

        const inv = data?.invite as InvitePublic | undefined;
        if (!inv?.email) {
          if (!cancelled) setError('Invalid invite');
          return;
        }

        if (!cancelled) {
          setInvite(inv);
          setName(inv.name || '');
        }
      } catch {
        if (!cancelled) setError('Failed to validate invite');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canSubmit =
    Boolean(invite) &&
    name.trim().length >= 2 &&
    password.length >= 10 &&
    password === confirm &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/invite/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, name }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof data?.error === 'string' ? data.error : 'Failed to claim invite';
        setError(message);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Failed to claim invite');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto">
        <PageHeader title="Invitation" description="Validating invite…" />
        <Card>
          <CardContent>
            <p className="text-sm text-neutral-600">Loading…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="max-w-xl mx-auto">
        <PageHeader title="Invitation" description="This invite is not valid." />
        <Card>
          <CardContent>
            <p className="text-sm text-neutral-700">{error || 'Invalid invite.'}</p>
            <p className="text-sm text-neutral-600 mt-2">
              Ask your administrator to generate a new invitation.
            </p>
            <p className="text-sm text-neutral-600 mt-4">
              <a className="underline" href="/">
                Back to home
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="Accept invitation"
        description={`Create your password for ${invite.email}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Set up your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-heading">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading">Email</label>
              <Input value={invite.email} disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading">Confirm password</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>

            {password && confirm && password !== confirm ? (
              <p className="text-sm text-red-600">Passwords do not match</p>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? 'Activating…' : 'Activate account'}
              </Button>
              <a className="text-sm text-neutral-600 underline" href="/">
                Cancel
              </a>
            </div>
          </form>

          <p className="text-xs text-neutral-500 mt-4">
            Role assigned by admin: <code className="text-xs">{invite.role}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
