'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { ModelFilePreview } from '@/components/molecules/previews/ModelFilePreview';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { ResourceDetailHeader } from '@/components/molecules/resource-ui/ResourceDetailHeader';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { useResourceMutations } from '@/hooks/useResourceMutations';

import { VersionSummary, VersionBindingSummary } from '../types';

type ResourceSummary = {
  id: string;
  kind: 'customMesh';
  activeVersion: number;
};

export function CustomMeshDetailPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [meshFile, setMeshFile] = React.useState<File | null>(null);
  const [boundingRadius, setBoundingRadius] = React.useState<string>('');


  const activeVersion = React.useMemo(
    () => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null,
    [versions, resource.activeVersion]
  );

  const activeComponentData = React.useMemo(() => {
    if (!activeVersion?.componentData) return {} as Record<string, unknown>;
    try {
      const parsed = JSON.parse(activeVersion.componentData);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
    return {} as Record<string, unknown>;
  }, [activeVersion]);

  const { submitting, setSubmitting, error, setError, reset } = useFormState();
  const router = useRouter();

  React.useEffect(() => {
    if (creatingOpen) return;
    setMeshFile(null);
    setBoundingRadius('');
    reset();
  }, [creatingOpen, reset]);

  React.useEffect(() => {
    if (!creatingOpen) return;
    const br = activeComponentData.boundingRadius;
    if (typeof br === 'number' && Number.isFinite(br) && br > 0) {
      setBoundingRadius(String(br));
    } else {
      setBoundingRadius('');
    }
  }, [creatingOpen, activeComponentData]);

  const submitNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!meshFile) {
      setError('A .glb mesh file is required.');
      return;
    }
    if (!meshFile.name.toLowerCase().endsWith('.glb')) {
      setError('Mesh file must be a .glb');
      return;
    }

    setSubmitting(true);
    try {
      const componentData: Record<string, unknown> = {};

      if (boundingRadius.trim().length) {
        const n = Number(boundingRadius);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error('Bounding radius must be a positive number (or empty).');
        }
        componentData.boundingRadius = n;
      }

      const files = { mesh: meshFile };
      const zipBlob = await createUploadZip({
        kind: 'customMesh',
        componentData,
      }, files);

      const zipFile = new File([zipBlob], `customMesh-${resource.id}.zip`, { type: 'application/zip' });

      const form = new FormData();
      form.set('zip', zipFile);

      const res = await fetch(`/api/admin/resources/${resource.id}/versions`, {
        method: 'POST',
        body: form,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error as string)) || `Failed to create version (${res.status})`;
        throw new Error(msg);
      }

      setCreatingOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  // Correction: submitNewVersion calls router.refresh() in original.
  // I should inject router into submitNewVersion or restore it.

  return (
    <div className="h-full min-h-0 flex flex-col">
      <ResourceDetailHeader
        title="Versions"
        activeVersion={resource.activeVersion}
        totalVersions={versions.length}
        onAction={() => setCreatingOpen(true)}
      />

      <section className="flex-1 min-h-0">
        <ResourceVersionsTable
          versions={versions}
          activeVersion={resource.activeVersion}
          onSetActive={setActiveVersion}
          onDelete={deleteVersion}
          deleteDisabled={(v) => versions.length <= 1 || resource.activeVersion === v.version || isBusy}
          deleteTitle={(v) =>
            versions.length <= 1
              ? 'Cannot delete the only version'
              : resource.activeVersion === v.version
                ? 'Cannot delete the active version'
                : 'Delete'
          }
          containerClassName="h-full"
        />
      </section>

      <ResourceDialogLayout
        open={creatingOpen}
        onOpenChange={setCreatingOpen}
        title="New Mesh Version"
        subtitle="Create"
        onClose={() => setCreatingOpen(false)}
        fullscreen={false}
        className="max-w-4xl"
      >
        <div className="flex h-full">
          {/* Split manually here because ResourceDialogForm/Preview panels assume flex containment which ResourceDialogLayout provides, 
                but ResourceDialogLayout provides a full flex container. 
                Wait, ResourceDialogLayout children are rendered in <div className="flex min-h-0 flex-1">.
                So I just need to place Form and Preview side by side.
            */}

          <ResourceDialogFormPanel onSubmit={async (e) => {
            await submitNewVersion(e);
            router.refresh();
          }} error={error}>
            <div className="space-y-2">
              <Label>Mesh (.glb)</Label>
              <input
                type="file"
                accept=".glb,model/gltf-binary"
                onChange={(e) => setMeshFile(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-neutral-600">
                {meshFile ? `Selected: ${meshFile.name}` : 'No file selected'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bounding Radius (optional)</Label>
              <Input
                type="number"
                step={0.01}
                min={0}
                placeholder="e.g. 1.25"
                value={boundingRadius}
                onChange={(e) => setBoundingRadius(e.target.value)}
              />
              <div className="text-xs text-neutral-600">
                Used by ECS-only features like Orbit until runtime bounds are known.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create version'}
              </Button>
            </div>
          </ResourceDialogFormPanel>

          <ResourceDialogPreviewPanel>
            <ModelFilePreview file={meshFile} onDropFile={(f) => setMeshFile(f)} className="h-full w-full" />
          </ResourceDialogPreviewPanel>
        </div>
      </ResourceDialogLayout>
    </div>
  );
}
