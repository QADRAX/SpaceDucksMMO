import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { getResourceGroup } from '@/lib/resourceGroups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parsePage(searchParams: Record<string, string | string[] | undefined>): number {
  const raw = searchParams.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(groupId: string, page: number): string {
  return `/admin/resources/group/${groupId}?page=${page}`;
}

export default async function ResourceGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { groupId } = await params;
  const resolvedSearchParams = await searchParams;

  const group = getResourceGroup(groupId);
  if (!group) notFound();

  const pageSize = 25;
  const page = parsePage(resolvedSearchParams);
  const skip = (page - 1) * pageSize;

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where: { kind: { in: [...group.kinds] } } }),
    prisma.resource.findMany({
      where: { kind: { in: [...group.kinds] } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      include: { _count: { select: { versions: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const rows = resources.map((r) => ({
    id: r.id,
    key: r.key,
    displayName: r.displayName,
    kind: r.kind,
    activeVersion: r.activeVersion,
    thumbnailFileAssetId: r.thumbnailFileAssetId ?? null,
    versionsCount: r._count.versions,
  }));

  return (
    <div>
      <PageHeader
        title={group.label}
        description="Resources filtered by group"
        actions={
          <Link href="/admin/resources" className="text-main underline">
            Back to Resources
          </Link>
        }
      />

      <ResourceTable
        rows={rows}
        emptyTitle={`No ${group.label.toLowerCase()} yet.`}
        emptyHint={
          <>
            Create them via <code className="text-xs">POST /api/admin/resources</code>.
          </>
        }
        pagination={{
          page,
          totalPages,
          total,
          prevHref: hasPrev ? buildPageHref(group.id, page - 1) : null,
          nextHref: hasNext ? buildPageHref(group.id, page + 1) : null,
        }}
      />
    </div>
  );
}
