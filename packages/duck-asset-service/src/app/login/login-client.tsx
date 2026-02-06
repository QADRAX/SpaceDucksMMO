'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { PageHeader } from '@/components/organisms/PageHeader';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo') || '/admin';

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : 'Login failed';
        setError(message);
        return;
      }

      router.push(returnTo);
      router.refresh();
    } catch {
      setError('Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Admin Login" description="Sign in to access /admin" />

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-heading">Username</label>
              <Input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-heading">Password</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting || !username || !password}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
              <a className="text-sm text-neutral-600 underline" href="/">
                Back to home
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-neutral-500 mt-4">
        Tip: set <code className="text-xs">ASSET_ADMIN_USER</code>,{' '}
        <code className="text-xs">ASSET_ADMIN_PASS</code>, and (recommended){' '}
        <code className="text-xs">ASSET_ADMIN_SESSION_SECRET</code>.
      </p>
    </div>
  );
}
