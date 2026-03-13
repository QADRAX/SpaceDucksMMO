import * as React from 'react';

import { Card, CardContent } from '@/components/molecules/Card';
import { InviteClient } from './invite-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : '';

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
      <InviteClient token={token} />
    </React.Suspense>
  );
}
