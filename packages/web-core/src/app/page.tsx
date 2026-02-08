import Link from 'next/link';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db';
import { getDbReadiness } from '@/lib/dbReadiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { PageHeader } from '@/components/organisms/PageHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const readiness = await getDbReadiness(prisma);
  if (!readiness.ready || readiness.userCount === 0) {
    redirect('/setup');
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <PageHeader title="Duck Engine Web Core" description="Assets, scenes, and tooling" />

      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin">
            <Button>Go to Admin Panel</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
