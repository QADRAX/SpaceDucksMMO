import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { EcsTreeEditor } from '@/components/organisms/ecsTreeEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SceneEditorPage({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) {
  const { sceneId } = await params;

  const resource = await prisma.resource.findUnique({
    where: { id: sceneId },
    select: { id: true, kind: true, displayName: true, key: true, activeVersion: true },
  });

  if (!resource) notFound();
  if (resource.kind !== 'scene') notFound();

  const activeVersion = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: resource.activeVersion } },
    select: { componentData: true },
  });

  const initialComponentDataJson = activeVersion?.componentData ?? null;

  return (
    <div>
      <PageHeader
        title={resource.displayName}
        description="Unity-like scene editor MVP (Hierarchy + Inspector + Undo/Redo + Play Mode)."
      />

      <EcsTreeEditor resource={resource} initialComponentDataJson={initialComponentDataJson} />
    </div>
  );
}
