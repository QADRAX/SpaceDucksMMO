'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { LocalGlbFilePreview } from '@/components/organisms/LocalGlbFilePreview';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';

type VersionBindingSummary = {
  id: string;
  slot: string;
  fileAssetId: string;
  fileName: string;
};

type VersionSummary = {
  id: string;
  version: number;
  componentType: string;
  componentData: string;
  bindings: VersionBindingSummary[];
};

type ResourceSummary = {
  id: string;
  kind: 'customMesh';
  activeVersion: number;
};

export function ResourceDetailCustomMeshPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [meshFile, setMeshFile] = React.useState<File | null>(null);
  const [boundingRadius, setBoundingRadius] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    if (creatingOpen) return;
    setMeshFile(null);
    setBoundingRadius('');
    setError(null);
    setSubmitting(false);
  }, [creatingOpen]);

  React.useEffect(() => {
    if (!creatingOpen) return;
    const br = activeComponentData.boundingRadius;
    if (typeof br === 'number' && Number.isFinite(br) && br > 0) {
      setBoundingRadius(String(br));
    } else {
      setBoundingRadius('');
    }
  }, [creatingOpen, activeComponentData]);

  const setActiveVersion = async (version: number) => {
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ activeVersion: version }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && (json.error as string)) || `Failed to set active version (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteVersion = async (version: number) => {
    const ok = confirm(`Delete version v${version}?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/resources/${resource.id}/versions/${version}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && (json.error as string)) || `Failed to delete version (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

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
      const form = new FormData();
      const componentData: Record<string, unknown> = {};

      if (boundingRadius.trim().length) {
        const n = Number(boundingRadius);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error('Bounding radius must be a positive number (or empty).');
        }
        componentData.boundingRadius = n;
      }

      if (Object.keys(componentData).length) {
        form.set('componentData', JSON.stringify(componentData, null, 2));
      }
      form.set('mesh', meshFile);

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

  return (
    <div className="h-full min-h-0 flex flex-col">
      <section className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-heading">Versions</div>
            <div className="text-xs text-neutral-600 mt-1">
              Active: <span className="font-bold text-black">v{resource.activeVersion}</span> · Total: {versions.length}
            </div>
          </div>
          <Button type="button" size="sm" onClick={() => setCreatingOpen(true)}>
            + Create / Upload
          </Button>
        </div>
      </section>

      <section className="flex-1 min-h-0">
        <ResourceVersionsTable
          versions={versions}
          activeVersion={resource.activeVersion}
          onSetActive={setActiveVersion}
          onDelete={deleteVersion}
          deleteDisabled={(v) => versions.length <= 1 || resource.activeVersion === v.version}
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

      <Dialog open={creatingOpen} onOpenChange={setCreatingOpen}>
        <DialogContent className="bg-white">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-600">Create</div>
              <div className="text-xl font-heading">New mesh version</div>
            </div>

            {error ? (
              <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                <strong>Error:</strong> {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={submitNewVersion}>
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
                <Label>Preview</Label>
                <div className="h-64 w-full">
                  <LocalGlbFilePreview file={meshFile} onDropFile={(f) => setMeshFile(f)} className="h-full w-full" />
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

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreatingOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create version'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
