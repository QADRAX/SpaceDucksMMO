import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { ResourceTable } from '@/components/organisms/ResourceTable';
import { CreateMaterialDialog } from '@/components/organisms/resources/material/CreateMaterialDialog';
import { CreateCustomMeshDialog } from '@/components/organisms/resources/custom-mesh/CreateCustomMeshDialog';
import { CreateEcsTreeDialog } from '@/components/organisms/resources/ecs-tree/CreateEcsTreeDialog';
import { CreateSkyboxDialog } from '@/components/organisms/resources/skybox/CreateSkyboxDialog';
import { CreateFullMeshDialog } from '@/components/organisms/resources/full-mesh/CreateFullMeshDialog';
import { getKindLabel, getResourceGroup, isKindInGroup } from '@/lib/resourceGroups';
import { MaterialComponentTypeSchema, ResourceKindSchema, type MaterialResourceKind } from '@/lib/types';

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

  const parsedKind = ResourceKindSchema.safeParse(kind);
  const viewHref = (() => {
    if (!parsedKind.success) return undefined;
    if (parsedKind.data === 'scene') return (id: string) => `/admin/scenes/${id}`;
    if (parsedKind.data === 'prefab') return (id: string) => `/admin/prefabs/${id}`;
    return undefined;
  })();

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
        viewHref={viewHref}
        toolbar={(() => {
          if (!parsedKind.success) return null;

          if (parsedKind.data === 'customMesh') {
            return (
              <CreateCustomMeshDialog
                kindLabel={getKindLabel(group, kind)}
              />
            );
          }

          if (parsedKind.data === 'fullMesh') {
            return <CreateFullMeshDialog kindLabel={getKindLabel(group, kind)} />;
          }

          if (parsedKind.data === 'skybox') {
            return <CreateSkyboxDialog kindLabel={getKindLabel(group, kind)} />;
          }

          if (parsedKind.data === 'prefab' || parsedKind.data === 'scene') {
            return (
              <CreateEcsTreeDialog
                kind={parsedKind.data}
                kindLabel={getKindLabel(group, kind)}
              />
            );
          }

          const materialKind = MaterialComponentTypeSchema.safeParse(parsedKind.data);
          if (!materialKind.success) return null;

          return (
            <CreateMaterialDialog
              kind={materialKind.data as MaterialResourceKind}
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
