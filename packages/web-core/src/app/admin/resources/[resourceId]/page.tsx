import Link from 'next/link';

import { prisma } from '@/lib/db';
import { Card } from '@/components/molecules/Card';
import { MaterialResourcePreview } from '@/components/organisms/MaterialResourcePreview';
import { ResourceDetailAdminPanel } from '@/components/organisms/ResourceDetailAdminPanel';
import { ResourceDetailShell } from '@/components/organisms/ResourceDetailShell';
import { ResourceDetailHeaderEditor } from '@/components/organisms/ResourceDetailHeaderEditor';
import { ResourceKindSchema } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;

  if (!resourceId) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-2xl font-heading">Resource not found</div>
        </div>
        <Card>
          <p className="text-neutral-600">Missing resource id.</p>
          <p className="text-neutral-600 text-sm mt-2">
            <Link href="/admin/resources" className="text-main underline">
              Back to Resources
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    return (
      <div>
        <div className="mb-6">
          <div className="text-2xl font-heading">Resource not found</div>
        </div>
        <Card>
          <p className="text-neutral-600">This resource does not exist.</p>
          <p className="text-neutral-600 text-sm mt-2">
            <Link href="/admin/resources" className="text-main underline">
              Back to Resources
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId: resource.id },
    orderBy: { version: 'desc' },
    include: { bindings: { include: { fileAsset: true } } },
  });

  const activeVersion =
    versions.find((v) => v.version === resource.activeVersion) ?? (versions.length > 0 ? versions[0] : null);

  const kindParsed = ResourceKindSchema.safeParse(resource.kind);
  const canPreviewMaterial = kindParsed.success && activeVersion;

  let previewComponentData: Record<string, unknown> = {};
  if (canPreviewMaterial && activeVersion) {
    try {
      const parsed = JSON.parse(activeVersion.componentData ?? '{}');
      previewComponentData = (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) ? parsed : {};
    } catch {
      previewComponentData = {};
    }

    // Best-effort: if componentData is missing texture URLs, fill them from bindings.
    const supportedTextureFields = new Set([
      'texture',
      'normalMap',
      'envMap',
      'aoMap',
      'roughnessMap',
      'metalnessMap',
      'specularMap',
      'bumpMap',
      'baseColor',
      'albedo',
    ]);

    for (const b of activeVersion.bindings ?? []) {
      if (!supportedTextureFields.has(b.slot)) continue;
      const url = `/api/files/${b.fileAssetId}`;

      if ((b.slot === 'baseColor' || b.slot === 'albedo')) {
        if (typeof previewComponentData.texture !== 'string' || previewComponentData.texture.length === 0) {
          previewComponentData.texture = url;
        }
        continue;
      }

      const current = previewComponentData[b.slot];
      if (typeof current !== 'string' || current.length === 0) {
        previewComponentData[b.slot] = url;
      }
    }
  }

  return (
    <ResourceDetailShell
      header={
        <ResourceDetailHeaderEditor
          resourceId={resource.id}
          initialDisplayName={resource.displayName}
          initialKey={resource.key}
          kind={resource.kind}
          activeVersion={resource.activeVersion}
          thumbnailFileAssetId={resource.thumbnailFileAssetId}
        />
      }
      title={resource.displayName}
      left={
        <div className="space-y-6">
          {kindParsed.success ? (
            <ResourceDetailAdminPanel
              resource={{
                id: resource.id,
                kind: kindParsed.data,
                activeVersion: resource.activeVersion,
              }}
              versions={versions.map((v) => ({
                id: v.id,
                version: v.version,
                componentType: v.componentType,
                componentData: v.componentData,
                bindings: (v.bindings ?? []).map((b) => ({
                  id: b.id,
                  slot: b.slot,
                  fileAssetId: b.fileAssetId,
                  fileName: b.fileAsset.fileName,
                })),
              }))}
            />
          ) : (
            <div className="space-y-2">
              <div className="font-heading">Resource management</div>
              <div className="text-sm text-neutral-600">
                This UI currently supports material resource kinds only.
              </div>
            </div>
          )}
        </div>
      }
      right={
        canPreviewMaterial ? (
          <MaterialResourcePreview
            kind={kindParsed.data}
            componentData={previewComponentData}
            className="h-full w-full"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-bg">
            <div className="text-sm text-neutral-600">No preview available for this resource kind.</div>
          </div>
        )
      }
      footer={
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="text-neutral-600">
            {activeVersion ? (
              <>
                Using version <span className="font-bold text-black">v{activeVersion.version}</span>
              </>
            ) : (
              'No versions yet'
            )}
          </div>
          <div className="text-neutral-600">Total versions: {versions.length}</div>
        </div>
      }
    />
  );
}
