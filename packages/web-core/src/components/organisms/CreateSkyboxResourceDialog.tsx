'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import JSZip from 'jszip';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { SkyboxDraft3DPreview } from '@/components/organisms/SkyboxDraft3DPreview';
import { cn } from '@/lib/utils';
import { rotateImageFile } from '@/lib/imageTransform';

type FaceSlot = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

const FACE_SLOTS: readonly FaceSlot[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

const FACE_HINTS: Record<FaceSlot, { title: string; suffixes: string }> = {
  px: { title: 'Right (+X)', suffixes: 'rt, right, posx, px' },
  nx: { title: 'Left (-X)', suffixes: 'lf, left, negx, nx' },
  py: { title: 'Up (+Y)', suffixes: 'up, top, posy, py' },
  ny: { title: 'Down (-Y)', suffixes: 'dn, down, bottom, negy, ny' },
  // Note: Three.js default camera looks down -Z, so "front" from a viewer perspective is -Z.
  nz: { title: 'Front (-Z)', suffixes: 'ft, front, negz, nz' },
  pz: { title: 'Back (+Z)', suffixes: 'bk, back, posz, pz' },
};

function extFromFile(file: File): string {
  const name = file.name || '';
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx).toLowerCase();
}

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
      } catch {}
    };
  }, [file]);

  return url;
}

function isImageFile(file: File): boolean {
  return typeof file?.type === 'string' && file.type.startsWith('image/');
}

function FaceDropBox({
  slot,
  file,
  previewUrl,
  onPick,
  onRotate,
}: {
  slot: FaceSlot;
  file: File | null;
  previewUrl: string | null;
  onPick: (slot: FaceSlot, file: File | null) => void;
  onRotate?: (slot: FaceSlot) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = React.useState(false);

  const hint = FACE_HINTS[slot];

  return (
    <div className="space-y-2">
      <div className="text-xs text-neutral-600">
        <span className="font-bold text-black">{slot.toUpperCase()}</span> — {hint.title}
      </div>

      <div
        role="button"
        tabIndex={0}
        className={cn(
          'relative aspect-square w-full rounded-base border-2 border-dashed border-border bg-white shadow-base overflow-hidden select-none',
          isOver ? 'outline-2 outline-border' : ''
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          const f = e.dataTransfer?.files?.[0] ?? null;
          if (!f) return;
          if (!isImageFile(f)) return;
          onPick(slot, f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(slot, e.target.files?.[0] ?? null)}
        />

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={`${slot} face`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
            <div className="text-xs text-neutral-600">
              Drop image here or click to select
            </div>
          </div>
        )}

        {file && (slot === 'py' || slot === 'ny') && onRotate ? (
          <div className="absolute top-2 left-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRotate(slot);
              }}
            >
              Rotate 90°
            </Button>
          </div>
        ) : null}

        <div className="absolute left-2 bottom-2 right-2">
          <div className="bg-white/90 border border-border rounded-base px-2 py-1 text-[11px]">
            <div className="truncate">{file ? file.name : 'No file'}</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-neutral-600">
        Common suffixes: <span className="font-mono">{hint.suffixes}</span>
      </div>
    </div>
  );
}

export function CreateSkyboxResourceDialog({ kindLabel }: { kindLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const draftPreviewKeyRef = React.useRef(
    `draft:skybox:${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())}`
  );

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

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setFaces({ px: null, nx: null, py: null, ny: null, pz: null, nz: null });
    setError(null);
    setSubmitting(false);
  }, [open]);

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

    const rotated = await rotateImageFile(current, 90);
    if (pickTokenRef.current[slot] !== token) return;

    setFaces((prev) => {
      // If the user picked a different file while rotating, ignore.
      if (prev[slot] !== current) return prev;
      return { ...prev, [slot]: rotated };
    });
  }, [faces]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !displayName.trim()) {
      setError('Key and Display Name are required.');
      return;
    }

    for (const slot of FACE_SLOTS) {
      if (!faces[slot]) {
        setError(`Missing face file: ${slot}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const zip = new JSZip();

      const fileEntries: Array<{ slot: FaceSlot; file: string }> = [];
      for (const slot of FACE_SLOTS) {
        const f = faces[slot]!;
        const ext = extFromFile(f) || '.png';
        const name = `${slot}${ext}`;
        zip.file(name, f);
        fileEntries.push({ slot, file: name });
      }

      const manifest = {
        kind: 'skybox',
        key: key.trim(),
        displayName: displayName.trim(),
        version: {
          version: 1,
          componentData: {},
          files: fileEntries,
        },
      };

      zip.file('resource.json', JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
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
                  <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="environment/skybox/blue-sky" />
                  <p className="text-xs text-neutral-600">Unique stable id. Used by the engine.</p>
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Blue Sky" />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="font-bold">Cube map faces</div>
                    <div className="text-xs text-neutral-600">Required slots: px, nx, py, ny, pz, nz</div>
                  </div>

                  <div className="max-w-3xl">
                    <div className="grid grid-cols-4 gap-3">
                      <div />
                      <FaceDropBox slot="py" file={faces.py} previewUrl={previews.py} onPick={onPickFace} onRotate={onRotateFace} />
                      <div />
                      <div />

                      <FaceDropBox slot="nx" file={faces.nx} previewUrl={previews.nx} onPick={onPickFace} />
                      <FaceDropBox slot="nz" file={faces.nz} previewUrl={previews.nz} onPick={onPickFace} />
                      <FaceDropBox slot="px" file={faces.px} previewUrl={previews.px} onPick={onPickFace} />
                      <FaceDropBox slot="pz" file={faces.pz} previewUrl={previews.pz} onPick={onPickFace} />

                      <div />
                      <FaceDropBox slot="ny" file={faces.ny} previewUrl={previews.ny} onPick={onPickFace} onRotate={onRotateFace} />
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
              </form>
            </div>

            <div className="min-w-0 flex-1 bg-bg">
              <SkyboxDraft3DPreview
                resourceKey={key.trim() ? key.trim() : draftPreviewKeyRef.current}
                files={previews}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
