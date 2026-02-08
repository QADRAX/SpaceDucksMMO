import * as React from 'react';

import { Card, CardContent } from '@/components/molecules/Card';
import { SetupClient } from './setup-client';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getDbReadiness } from '@/lib/dbReadiness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SetupPage() {
  const readiness = await getDbReadiness(prisma);
  if (readiness.ready && readiness.userCount > 0) {
    redirect('/login');
  }

  if (!readiness.ready) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="space-y-2">
              <div className="font-heading text-lg">Database not initialized</div>
              <p className="text-sm text-neutral-600">
                Your SQLite database exists but Prisma tables are missing. This commonly happens after deleting
                <code className="mx-1">prisma/dev.db</code>.
              </p>
              <p className="text-sm text-neutral-600">
                Run migrations, then reload this page:
              </p>
              <pre className="text-xs bg-neutral-50 border border-border rounded-base p-3 overflow-auto">npm run prisma:migrate</pre>
              <p className="text-xs text-neutral-500">
                (If a dev server is running, stop it first to avoid Windows file locks.)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="max-w-xl mx-auto">
          <Card>
            <CardContent>
              <p className="text-sm text-neutral-600">Loading…</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SetupClient />
    </React.Suspense>
  );
}
