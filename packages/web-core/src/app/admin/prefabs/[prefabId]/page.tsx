import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { EcsTreeEditor } from '@/components/organisms/ecsTreeEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PrefabEditorPage({
  params,
}: {
  params: Promise<{ prefabId: string }>;
}) {
  const { prefabId } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id: prefabId },
    select: { id: true, kind: true, displayName: true, key: true, activeVersion: true },
  });

  if (!resource) notFound();
  if (resource.kind !== 'prefab') notFound();

  const activeVersion = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: resource.activeVersion } },
    select: { componentData: true },
  });

  const initialComponentDataJson = activeVersion?.componentData ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <EcsTreeEditor resource={resource} initialComponentDataJson={initialComponentDataJson} />
    </div>
  );
}
