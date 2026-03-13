'use client';

import * as React from 'react';



import { Button } from '@/components/atoms/Button';
import { Skybox3DPreview } from '@/components/molecules/previews/Skybox3DPreview';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { rotateImageFile } from '@/lib/imageTransform';
import { ResourceDetailHeader } from '@/components/molecules/resource-ui/ResourceDetailHeader';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { useResourceMutations } from '@/hooks/useResourceMutations';
import { SkyboxFaceDropBox, FACE_SLOTS, type FaceSlot } from '@/components/molecules/resource-ui/SkyboxFaceDropBox';
import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';
import { AdminService } from '@/lib/api';

import { VersionSummary, VersionBindingSummary } from '../types';

type ResourceSummary = {
  id: string;
  kind: 'skybox';
  activeVersion: number;
  key: string;
};

type FaceFileState = {
  file: File;
  blobUrl: string;
};



export function SkyboxDetailPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

  const { submitting, setSubmitting, error, setError, reset } = useFormState();
  const router = require('next/navigation').useRouter();

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [faces, setFaces] = React.useState<Record<FaceSlot, FaceFileState | null>>({
    px: null,
    nx: null,
    py: null,
    ny: null,
    pz: null,
    nz: null,
  });

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
    reset();
  }, [creatingOpen, cleanupFaces, reset]);

  const submitNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const files: Record<string, File> = {};
    for (const slot of FACE_SLOTS) {
      if (!faces[slot]) {
        setError(`Missing face file: ${slot}`);
        return;
      }
      files[slot] = faces[slot]!.file;
    }

    setSubmitting(true);
    try {
      const zipBlob = await createUploadZip({
        kind: 'skybox',
        versionNumber: undefined,
      }, files);

      const zipFile = new File([zipBlob], `skybox-${resource.id}.zip`, {
        type: 'application/zip',
      });

      await AdminService.postApiAdminResourcesVersions(resource.id, {
        zip: zipFile,
      });

      setCreatingOpen(false);
      // window.location.reload(); // Original used fetch which doesn't auto-reload, but component has router.refresh(). 
      // The original code had window.location.reload() which is abrupt. router.refresh() is better if the server component updates.
      // However, the previous code had window.location.reload(). I will stick to router.refresh() if possible, or keep reload if critical.
      // The original code:
      // setCreatingOpen(false);
      // window.location.reload();
      // I will replace with router.refresh() as seen in other components, or keep it if I must.
      // Actually, SkyboxDetailPanel used window.location.reload().
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  };

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
        title="New Skybox Version"
        subtitle="Upload"
        onClose={() => setCreatingOpen(false)}
        fullscreen={true}
        className="max-w-4xl"
      >
        <div className="flex h-full">
          <ResourceDialogFormPanel onSubmit={async (e) => {
            await submitNewVersion(e);
            router.refresh();
          }} error={error}>
            <div className="space-y-3">
              <div className="font-bold">Cube map faces</div>
              <div className="text-xs text-neutral-600">Required slots: px, nx, py, ny, pz, nz</div>

              <div className="grid grid-cols-2 gap-3">
                {FACE_SLOTS.map(slot => (
                  <SkyboxFaceDropBox
                    key={slot}
                    slot={slot}
                    file={faces[slot]?.file ?? null}
                    previewUrl={faces[slot]?.blobUrl ?? null}
                    onPick={(s, f) => setFaceFile(s, f)}
                    onRotate={rotateFace}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Uploading…' : 'Upload version'}
              </Button>
            </div>
          </ResourceDialogFormPanel>

          <ResourceDialogPreviewPanel>
            <Skybox3DPreview
              resourceKey={resource.key}
              activeVersion={resource.activeVersion}
              className="h-full w-full"
            />
          </ResourceDialogPreviewPanel>
        </div>
      </ResourceDialogLayout>
    </div>
  );
}
