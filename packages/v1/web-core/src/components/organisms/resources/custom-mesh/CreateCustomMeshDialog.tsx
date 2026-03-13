'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';
import { createResourceWithZip } from '@/lib/api';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { ModelFilePreview } from '@/components/molecules/previews/ModelFilePreview';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';

export function CreateCustomMeshDialog({
  kindLabel,
}: {
  kindLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { submitting, setSubmitting, error, setError, reset } = useFormState();
  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [meshFile, setMeshFile] = React.useState<File | null>(null);
  const [boundingRadius, setBoundingRadius] = React.useState('');

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setMeshFile(null);
    setBoundingRadius('');
    reset();
  }, [open, reset]);

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
      const files = { mesh: meshFile };
      const componentData = parsedBoundingRadius !== undefined ? { boundingRadius: parsedBoundingRadius } : {};

      const zipBlob = await createUploadZip({
        kind: 'customMesh',
        key: key.trim(),
        displayName: displayName.trim(),
        componentData,
      }, files);

      const zipFile = new File([zipBlob], `${key.trim() || 'customMesh'}.zip`, {
        type: 'application/zip',
      });

      await createResourceWithZip({
        kind: 'customMesh',
        key: key.trim(),
        displayName: displayName.trim(),
        zip: zipFile,
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Create resource
      </Button>

      <ResourceDialogLayout
        open={open}
        onOpenChange={setOpen}
        title={kindLabel}
        onClose={() => setOpen(false)}
      >
        <ResourceDialogFormPanel onSubmit={onSubmit} error={error}>
          <ResourceKeyInput value={key} onChange={setKey} placeholder="meshes/duck" disabled={submitting} />
          <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="Duck Mesh" disabled={submitting} />

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
              disabled={submitting}
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
        </ResourceDialogFormPanel>

        <ResourceDialogPreviewPanel>
          <ModelFilePreview
            file={meshFile}
            onDropFile={(f) => setMeshFile(f)}
            className="h-full w-full"
          />
        </ResourceDialogPreviewPanel>
      </ResourceDialogLayout>
    </>
  );
}
