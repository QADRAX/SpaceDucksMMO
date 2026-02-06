import * as React from 'react';

import { Card, CardContent } from '@/components/molecules/Card';
import { LoginClient } from './login-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginPage() {
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
