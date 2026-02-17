'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';
import { Skybox3DPreview } from '@/components/molecules/previews/Skybox3DPreview';
import { SkyboxFaceDropBox, FACE_SLOTS, type FaceSlot } from '@/components/molecules/resource-ui/SkyboxFaceDropBox';
import { rotateImageFile } from '@/lib/imageTransform';
import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => {
      try {
        URL.revokeObjectURL(next);
      } catch { }
    };
  }, [file]);

  return url;
}

export function CreateSkyboxDialog({ kindLabel }: { kindLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { submitting, setSubmitting, error, setError, reset } = useFormState();

  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [faces, setFaces] = React.useState<Record<FaceSlot, File | null>>({
    px: null,
    nx: null,
    py: null,
    ny: null,
    pz: null,
    nz: null,
  });

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setFaces({ px: null, nx: null, py: null, ny: null, pz: null, nz: null });
    reset();
  }, [open, reset]);

  const previews = {
    px: useObjectUrl(faces.px),
    nx: useObjectUrl(faces.nx),
    py: useObjectUrl(faces.py),
    ny: useObjectUrl(faces.ny),
    pz: useObjectUrl(faces.pz),
    nz: useObjectUrl(faces.nz),
  };

  const pickTokenRef = React.useRef<Record<FaceSlot, number>>({
    px: 0,
    nx: 0,
    py: 0,
    ny: 0,
    pz: 0,
    nz: 0,
  });

  const onPickFace = React.useCallback((slot: FaceSlot, file: File | null) => {
    pickTokenRef.current[slot] += 1;
    setFaces((prev) => ({ ...prev, [slot]: file }));
  }, []);

  const onRotateFace = React.useCallback(async (slot: FaceSlot) => {
    const current = faces[slot];
    if (!current) return;

    pickTokenRef.current[slot] += 1;
    const token = pickTokenRef.current[slot];

    try {
      const rotated = await rotateImageFile(current, 90);
      if (pickTokenRef.current[slot] !== token) return;

      setFaces((prev) => {
        // If the user picked a different file while rotating, ignore.
        if (prev[slot] !== current) return prev;
        return { ...prev, [slot]: rotated };
      });
    } catch {
      // ignore
    }
  }, [faces]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !displayName.trim()) {
      setError('Key and Display Name are required.');
      return;
    }

    const files: Record<string, File> = {};
    for (const slot of FACE_SLOTS) {
      if (!faces[slot]) {
        setError(`Missing face file: ${slot}`);
        return;
      }
      files[slot] = faces[slot]!;
    }

    setSubmitting(true);
    try {
      const zipBlob = await createUploadZip({
        kind: 'skybox',
        key: key.trim(),
        displayName: displayName.trim(),
      }, files);

      const zipFile = new File([zipBlob], `${key.trim() || 'skybox'}.zip`, {
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
          <ResourceKeyInput value={key} onChange={setKey} placeholder="environment/skybox/blue-sky" disabled={submitting} />
          <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="Blue Sky" disabled={submitting} />

          <div className="space-y-3">
            <div>
              <div className="font-bold">Cube map faces</div>
              <div className="text-xs text-neutral-600">Required slots: px, nx, py, ny, pz, nz</div>
            </div>

            <div className="max-w-3xl">
              <div className="grid grid-cols-4 gap-3">
                <div />
                <SkyboxFaceDropBox slot="py" file={faces.py} previewUrl={previews.py} onPick={onPickFace} onRotate={onRotateFace} />
                <div />
                <div />

                <SkyboxFaceDropBox slot="nx" file={faces.nx} previewUrl={previews.nx} onPick={onPickFace} />
                <SkyboxFaceDropBox slot="nz" file={faces.nz} previewUrl={previews.nz} onPick={onPickFace} />
                <SkyboxFaceDropBox slot="px" file={faces.px} previewUrl={previews.px} onPick={onPickFace} />
                <SkyboxFaceDropBox slot="pz" file={faces.pz} previewUrl={previews.pz} onPick={onPickFace} />

                <div />
                <SkyboxFaceDropBox slot="ny" file={faces.ny} previewUrl={previews.ny} onPick={onPickFace} onRotate={onRotateFace} />
                <div />
                <div />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </ResourceDialogFormPanel>

        <ResourceDialogPreviewPanel>
          <Skybox3DPreview
            draftFiles={
              // Map local files to object URLs for preview
              Object.entries(faces).reduce(
                (acc, [k, v]) => ({
                  ...acc,
                  [k]: v ? URL.createObjectURL(v) : null,
                }),
                {} as Record<FaceSlot, string | null>
              )
            }
            className="h-full w-full"
          />
        </ResourceDialogPreviewPanel>
      </ResourceDialogLayout>
    </>
  );
}
