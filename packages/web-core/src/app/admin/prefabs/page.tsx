import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { CreateEcsTreeDialog } from '@/components/organisms/resources/ecs-tree/CreateEcsTreeDialog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parsePage(searchParams: Record<string, string | string[] | undefined>): number {
  const raw = searchParams.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(page: number): string {
  return `/admin/prefabs?page=${page}`;
}

export default async function PrefabsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const pageSize = 25;
  const page = parsePage(resolvedSearchParams);
  const skip = (page - 1) * pageSize;

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where: { kind: 'prefab' } }),
    prisma.resource.findMany({
      where: { kind: 'prefab' },
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
      <PageHeader title="Prefabs" description="Versioned prefab snapshots (ECS tree)" />

      <ResourceTable
        rows={rows}
        toolbar={<CreateEcsTreeDialog kind="prefab" kindLabel="Prefab" />}
        emptyTitle="No prefabs yet."
        emptyHint={<>Create one to start building reusable entity trees.</>}
        viewHref={(id) => `/admin/prefabs/${id}`}
        pagination={{
          page,
          totalPages,
          total,
          prevHref: hasPrev ? buildPageHref(page - 1) : null,
          nextHref: hasNext ? buildPageHref(page + 1) : null,
        }}
      />
    </div>
  );
}
