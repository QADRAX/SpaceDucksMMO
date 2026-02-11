'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import JSZip from 'jszip';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { LocalGlbFilePreview } from '@/components/organisms/LocalGlbFilePreview';

export function CreateCustomMeshResourceDialog({
  kindLabel,
}: {
  kindLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [meshFile, setMeshFile] = React.useState<File | null>(null);
  const [boundingRadius, setBoundingRadius] = React.useState('');

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setMeshFile(null);
    setBoundingRadius('');
    setError(null);
    setSubmitting(false);
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !displayName.trim()) {
      setError('Key and Display Name are required.');
      return;
    }

    if (!meshFile) {
      setError('A .glb mesh file is required.');
      return;
    }

    if (!meshFile.name.toLowerCase().endsWith('.glb')) {
      setError('Mesh file must be a .glb');
      return;
    }

    let parsedBoundingRadius: number | undefined;
    if (boundingRadius.trim().length) {
      const n = Number(boundingRadius);
      if (!Number.isFinite(n) || n <= 0) {
        setError('Bounding radius must be a positive number (or empty).');
        return;
      }
      parsedBoundingRadius = n;
    }

    setSubmitting(true);
    try {
      const zip = new JSZip();

      // Put the mesh in the ZIP.
      const meshName = 'mesh.glb';
      zip.file(meshName, meshFile);

      const manifest = {
        kind: 'customMesh',
        key: key.trim(),
        displayName: displayName.trim(),
        version: {
          version: 1,
          componentData: {
            ...(parsedBoundingRadius !== undefined ? { boundingRadius: parsedBoundingRadius } : {}),
          },
          files: [{ slot: 'mesh', file: meshName }],
        },
      };

      zip.file('resource.json', JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], `${key.trim() || 'customMesh'}.zip`, {
        type: 'application/zip',
      });

      const form = new FormData();
      form.set('zip', zipFile);

      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        body: form,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error as string)) || `Failed to create resource (${res.status})`;
        throw new Error(msg);
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        + Create resource
      </Button>

      <DialogContent fullscreen className="bg-white">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-600">Create</div>
              <div className="text-xl font-heading">{kindLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
                Close
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <div className="w-full max-w-xl border-r border-border overflow-auto scrollbar p-6">
              <form className="space-y-6" onSubmit={onSubmit}>
                {error ? (
                  <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="meshes/duck" />
                  <p className="text-xs text-neutral-600">Unique stable id. Used by the engine.</p>
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Duck Mesh" />
                </div>

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
                  <p className="text-xs text-neutral-600">
                    Used by ECS-only features like Orbit until runtime bounds are known.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="min-w-0 flex-1 bg-bg">
              <LocalGlbFilePreview
                file={meshFile}
                onDropFile={(f) => setMeshFile(f)}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
