'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { PageHeader } from '@/components/organisms/PageHeader';

export function SetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/admin';

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 3 &&
    password.length >= 10 &&
    password === confirm &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : 'Setup failed';
        setError(message);
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setError('Setup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-main text-main-foreground p-12 flex-col justify-between">
        <div>
          <div className="text-2xl font-heading">Duck Engine Web Core</div>
          <p className="mt-2 text-sm opacity-90">
            Welcome! Let’s create your first super admin.
          </p>
        </div>
        <div className="text-sm opacity-90">
          <p>Standalone install • Local SQLite • JWT + RBAC</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <PageHeader
            title="Welcome"
            description="Create the first super admin user to initialize Web Core"
          />

          <Card>
            <CardHeader>
              <CardTitle>Super admin account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-heading">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Admin"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-heading">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@local"
                    autoComplete="email"
                  />
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
                    {submitting ? 'Creating…' : 'Create super admin'}
                  </Button>
                  <a className="text-sm text-neutral-600 underline" href="/">
                    Back
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-xs text-neutral-500 mt-4">
            Tip: set <code className="text-xs">AUTH_JWT_SECRET</code> for production.
          </p>
        </div>
      </div>
    </div>
  );
}
