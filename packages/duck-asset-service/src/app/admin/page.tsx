import Link from 'next/link';
import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { StatCard } from '@/components/molecules/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';

// Force dynamic rendering - don't try to statically generate this page
export const dynamic = 'force-dynamic';

async function getStats() {
  const [materialCount, versionCount] = await Promise.all([
    prisma.resource.count({
      where: { kind: 'material', isArchived: false },
    }),
    prisma.resourceVersion.count({
      where: {
        resource: { kind: 'material', isArchived: false },
      },
    }),
  ]);

  return { materialCount, versionCount };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        description="Overview of your web core data" 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Materials" value={stats.materialCount} />
        <StatCard label="Total Versions" value={stats.versionCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/admin/materials">
            <Button>View Materials</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
