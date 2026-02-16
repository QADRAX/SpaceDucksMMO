'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import JSZip from 'jszip';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { SkyboxDraft3DPreview } from '@/components/organisms/SkyboxDraft3DPreview';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { rotateImageFile } from '@/lib/imageTransform';

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
  kind: 'skybox';
  activeVersion: number;
};

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

type FaceFileState = {
  file: File;
  blobUrl: string;
};

function extFromFile(file: File): string {
  const name = file.name || '';
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx).toLowerCase();
}

export function ResourceDetailSkyboxPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [faces, setFaces] = React.useState<Record<FaceSlot, FaceFileState | null>>({
    px: null,
    nx: null,
    py: null,
    ny: null,
    pz: null,
    nz: null,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pickTokenRef = React.useRef<Record<FaceSlot, number>>({
    px: 0,
    nx: 0,
    py: 0,
    ny: 0,
    pz: 0,
    nz: 0,
  });

  const cleanupFaces = React.useCallback((state: Record<FaceSlot, FaceFileState | null>) => {
    for (const s of Object.values(state)) {
      if (!s?.blobUrl) continue;
      try {
        URL.revokeObjectURL(s.blobUrl);
      } catch {
        // ignore
      }
    }
  }, []);

  React.useEffect(() => {
    return () => {
      cleanupFaces(faces);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFaceFile = React.useCallback(
    (slot: FaceSlot, file: File | null) => {
      pickTokenRef.current[slot] += 1;
      const token = pickTokenRef.current[slot];

      const commit = (finalFile: File | null) => {
        const blobUrl = finalFile ? URL.createObjectURL(finalFile) : null;
        setFaces((prev) => {
          const next = { ...prev };
          const existing = next[slot];
          if (existing?.blobUrl) {
            try {
              URL.revokeObjectURL(existing.blobUrl);
            } catch {
              // ignore
            }
          }

          if (!finalFile || !blobUrl) {
            next[slot] = null;
          } else {
            next[slot] = { file: finalFile, blobUrl };
          }
          return next;
        });
      };

      if (!file) {
        commit(null);
        return;
      }

      // Optimistic commit for instant preview.
      commit(file);

      void token;
    },
    []
  );

  const rotateFace = React.useCallback(
    async (slot: FaceSlot) => {
      const current = faces[slot]?.file ?? null;
      if (!current) return;

      pickTokenRef.current[slot] += 1;
      const token = pickTokenRef.current[slot];

      try {
        const rotated = await rotateImageFile(current, 90);
        if (pickTokenRef.current[slot] !== token) return;
        // Only apply if still the same file selected.
        if ((faces[slot]?.file ?? null) !== current) return;
        setFaceFile(slot, rotated);
      } catch {
        // ignore
      }
    },
    [faces, setFaceFile]
  );

  const previewKey = React.useMemo(() => `draft:skybox:${resource.id}`, [resource.id]);
  const previewFiles = React.useMemo(
    () => ({
      px: faces.px?.blobUrl ?? null,
      nx: faces.nx?.blobUrl ?? null,
      py: faces.py?.blobUrl ?? null,
      ny: faces.ny?.blobUrl ?? null,
      pz: faces.pz?.blobUrl ?? null,
      nz: faces.nz?.blobUrl ?? null,
    }),
    [faces]
  );

  React.useEffect(() => {
    if (creatingOpen) return;
    setFaces((prev) => {
      cleanupFaces(prev);
      return { px: null, nx: null, py: null, ny: null, pz: null, nz: null };
    });
    setError(null);
    setSubmitting(false);
  }, [creatingOpen, cleanupFaces]);

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
        const f = faces[slot]!.file;
        const ext = extFromFile(f) || '.png';
        const name = `${slot}${ext}`;
        zip.file(name, f);
        fileEntries.push({ slot, file: name });
      }

      const versionManifest = {
        version: undefined,
        componentData: {},
        componentType: 'skybox',
        files: fileEntries,
      };

      zip.file('version.json', JSON.stringify(versionManifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([zipBlob], `skybox-${resource.id}.zip`, {
        type: 'application/zip',
      });

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
            + Upload
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
              <div className="text-xs uppercase tracking-wide text-neutral-600">Upload</div>
              <div className="text-xl font-heading">New skybox version</div>
            </div>

            {error ? (
              <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                <strong>Error:</strong> {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={submitNewVersion}>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="h-64 w-full">
                  <SkyboxDraft3DPreview
                    resourceKey={previewKey}
                    files={previewFiles}
                    className="h-full w-full"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-bold">Cube map faces</div>
                {FACE_SLOTS.map((slot) => (
                  <div key={slot} className="space-y-2">
                    <Label>{slot.toUpperCase()} — {FACE_HINTS[slot].title}</Label>
                    <div className="text-xs text-neutral-600">
                      Common suffixes: <span className="font-mono">{FACE_HINTS[slot].suffixes}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFaceFile(slot, e.target.files?.[0] ?? null)}
                    />
                    <div className="text-xs text-neutral-600">
                      {faces[slot]?.file ? `Selected: ${faces[slot]!.file.name}` : 'No file selected'}
                    </div>

                    {faces[slot]?.file && (slot === 'py' || slot === 'ny') ? (
                      <div>
                        <Button type="button" size="sm" variant="secondary" onClick={() => rotateFace(slot)}>
                          Rotate 90°
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreatingOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Uploading…' : 'Upload version'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
