import * as React from 'react';

import { Card, CardContent } from '@/components/molecules/Card';
import { SetupClient } from './setup-client';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) {
    redirect('/login');
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
