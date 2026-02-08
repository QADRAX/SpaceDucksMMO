import Link from 'next/link';

import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { Card } from '@/components/molecules/Card';
import { MaterialResourcePreview } from '@/components/organisms/MaterialResourcePreview';
import { ResourceDetailAdminPanel } from '@/components/organisms/ResourceDetailAdminPanel';
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
        <PageHeader title="Resource not found" />
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
        <PageHeader title="Resource not found" />
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
    <div>
      <PageHeader
        title={resource.displayName}
        description={resource.key}
        actions={
          <Link href="/admin/resources" className="text-main underline">
            Back
          </Link>
        }
      />

      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div>
              <span className="font-heading">Resource ID:</span> {resource.id}
            </div>
            <div>
              <span className="font-heading">Kind:</span> <code className="text-xs">{resource.kind}</code>
            </div>
            <div>
              <span className="font-heading">Engine resolve:</span>{' '}
              <code className="text-xs bg-bg px-2 py-1 rounded-base border border-border">
                /api/engine/resources/resolve?key={resource.key}
              </code>
            </div>
          </div>

          <div>
            {resource.thumbnailFileAssetId ? (
              <img
                src={`/api/files/${resource.thumbnailFileAssetId}`}
                alt={`${resource.displayName} thumbnail`}
                className="w-24 h-24 rounded-base border border-border object-cover bg-bg"
                loading="lazy"
              />
            ) : (
              <div className="w-24 h-24 rounded-base border border-border bg-bg" />
            )}
          </div>
        </div>
      </Card>

      {canPreviewMaterial ? (
        <>
          <div className="h-6" />
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-heading">Preview</div>
                <div className="text-sm text-neutral-600">
                  Using version <span className="font-bold text-black">v{activeVersion?.version}</span>
                </div>
              </div>
            </div>

            <div className="h-4" />

            <MaterialResourcePreview
              kind={kindParsed.data}
              componentData={previewComponentData}
              className="w-full h-90"
            />
          </Card>
        </>
      ) : null}

      {kindParsed.success ? (
        <>
          <div className="h-6" />
          <ResourceDetailAdminPanel
            resource={{
              id: resource.id,
              key: resource.key,
              displayName: resource.displayName,
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
        </>
      ) : (
        <>
          <div className="h-6" />
          <Card>
            <div className="font-heading">Resource management</div>
            <div className="text-sm text-neutral-600 mt-2">
              This UI currently supports material resource kinds only.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
