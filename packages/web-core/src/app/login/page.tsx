import * as React from 'react';

import { Card, CardContent } from '@/components/molecules/Card';
import { LoginClient } from './login-client';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getDbReadiness } from '@/lib/dbReadiness';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  const readiness = await getDbReadiness(prisma);
  if (!readiness.ready || readiness.userCount === 0) {
    redirect('/setup');
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
      <LoginClient />
    </React.Suspense>
  );
}
