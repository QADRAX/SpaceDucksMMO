import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { CreateMaterialResourceDialog } from '@/components/organisms/CreateMaterialResourceDialog';
import { CreateCustomMeshResourceDialog } from '@/components/organisms/CreateCustomMeshResourceDialog';
import { getKindLabel, getResourceGroup, isKindInGroup } from '@/lib/resourceGroups';
import { MaterialComponentTypeSchema, ResourceKindSchema } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parsePage(searchParams: Record<string, string | string[] | undefined>): number {
  const raw = searchParams.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(groupId: string, kind: string, page: number): string {
  return `/admin/resources/group/${groupId}/${kind}?page=${page}`;
}

export default async function ResourceGroupKindPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string; kind: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { groupId, kind } = await params;
  const resolvedSearchParams = await searchParams;

  const group = getResourceGroup(groupId);
  if (!group) notFound();
  if (!isKindInGroup(group, kind)) notFound();

  const pageSize = 25;
  const page = parsePage(resolvedSearchParams);
  const skip = (page - 1) * pageSize;

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where: { kind } }),
    prisma.resource.findMany({
      where: { kind },
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
        title={getKindLabel(group, kind)}
        description={`${group.label} / kind`}
        actions={
          <Link href={`/admin/resources/group/${group.id}`} className="text-main underline">
            Back to {group.label}
          </Link>
        }
      />

      <ResourceTable
        rows={rows}
        emptyTitle="No resources of this kind yet."
        toolbar={(() => {
          const parsed = ResourceKindSchema.safeParse(kind);
          if (!parsed.success) return null;

          if (parsed.data === 'customMesh') {
            return (
              <CreateCustomMeshResourceDialog
                kindLabel={getKindLabel(group, kind)}
              />
            );
          }

          const materialKind = MaterialComponentTypeSchema.safeParse(parsed.data);
          if (!materialKind.success) return null;

          return (
            <CreateMaterialResourceDialog
              kind={materialKind.data}
              kindLabel={getKindLabel(group, kind)}
            />
          );
        })()}
        pagination={{
          page,
          totalPages,
          total,
          prevHref: hasPrev ? buildPageHref(group.id, kind, page - 1) : null,
          nextHref: hasNext ? buildPageHref(group.id, kind, page + 1) : null,
        }}
      />
    </div>
  );
}
