'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { ModelFilePreview } from '@/components/molecules/previews/ModelFilePreview';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';

export function CreateFullMeshDialog({ kindLabel }: { kindLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [meshFile, setMeshFile] = React.useState<File | null>(null);
  const [boundingRadius, setBoundingRadius] = React.useState('');
  const [animations, setAnimations] = React.useState<{ name: string; duration: number }[]>([]);
  const [selectedClip, setSelectedClip] = React.useState<string>('');

  const { submitting, setSubmitting, error, setError, reset } = useFormState();

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setMeshFile(null);
    setBoundingRadius('');
    setAnimations([]);
    setSelectedClip('');
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
      const componentData: Record<string, unknown> = {
        ...(parsedBoundingRadius !== undefined ? { boundingRadius: parsedBoundingRadius } : {}),
        ...(selectedClip ? { animation: { clipName: selectedClip } } : {}),
      };

      const files = { mesh: meshFile };
      const zipBlob = await createUploadZip({
        kind: 'fullMesh',
        key: key.trim(),
        displayName: displayName.trim(),
        componentData,
      }, files);

      const zipFile = new File([zipBlob], `${key.trim() || 'fullMesh'}.zip`, { type: 'application/zip' });

      const form = new FormData();
      form.set('zip', zipFile);

      const res = await fetch('/api/admin/resources', { method: 'POST', body: form });
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
            <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => setMeshFile(e.target.files?.[0] ?? null)} />
            <div className="text-xs text-neutral-600">{meshFile ? `Selected: ${meshFile.name}` : 'No file selected'}</div>
          </div>

          <div className="space-y-2">
            <Label>Bounding Radius (optional)</Label>
            <Input type="number" step={0.01} min={0} placeholder="e.g. 1.25" value={boundingRadius} onChange={(e) => setBoundingRadius(e.target.value)} disabled={submitting} />
            <p className="text-xs text-neutral-600">Used by ECS-only features like Orbit until runtime bounds are known.</p>
          </div>

          {animations.length > 0 && (
            <div className="space-y-2">
              <Label>Default Animation Clip (optional)</Label>
              <select className="w-full p-2 border border-border rounded" value={selectedClip} onChange={(e) => setSelectedClip(e.target.value)} disabled={submitting}>
                <option value="">(none)</option>
                {animations.map((a) => (
                  <option key={a.name} value={a.name}>{a.name || '(unnamed)'}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
          </div>
        </ResourceDialogFormPanel>

        <ResourceDialogPreviewPanel>
          <ModelFilePreview
            file={meshFile}
            onDropFile={(f) => setMeshFile(f)}
            className="h-full w-full"
            showAnimations
            onAnimations={(a) => {
              setAnimations(a);
              if (a && a.length && !selectedClip) setSelectedClip(a[0].name);
            }}
          />
        </ResourceDialogPreviewPanel>
      </ResourceDialogLayout>
    </>
  );
}

export default CreateFullMeshDialog;
