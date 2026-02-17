'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
  type InspectorFieldConfig,
} from '@duckengine/ecs';

import type { MaterialResourceKind } from '@/lib/types';
import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { MaterialPreview } from '@/components/molecules/previews/MaterialPreview';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { ResourceDetailHeader } from '@/components/molecules/resource-ui/ResourceDetailHeader';
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { useResourceMutations } from '@/hooks/useResourceMutations';
import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';
import { AdminService, updateResourceVersionWithFiles } from '@/lib/api';

import { VersionSummary, VersionBindingSummary } from '../types';

type ResourceSummary = {
  id: string;
  key: string;
  kind: MaterialResourceKind;
  activeVersion: number;
};

type TextureFileState = {
  file: File;
  blobUrl: string;
};

function getMaterialInspectorFields(kind: MaterialResourceKind): InspectorFieldConfig<any, unknown>[] {
  switch (kind) {
    case 'basicMaterial':
      return new BasicMaterialComponent().metadata.inspector?.fields ?? [];
    case 'lambertMaterial':
      return new LambertMaterialComponent().metadata.inspector?.fields ?? [];
    case 'phongMaterial':
      return new PhongMaterialComponent().metadata.inspector?.fields ?? [];
    case 'standardMaterial':
    default:
      return new StandardMaterialComponent().metadata.inspector?.fields ?? [];
  }
}

function parseComponentData(raw: string | null): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw ?? '{}');
    if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}

export function MaterialDetailPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();
  const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

  const inspectorFields = React.useMemo(() => getMaterialInspectorFields(resource.kind), [resource.kind]);
  const textureFields = React.useMemo(
    () => inspectorFields.filter((f) => f.type === 'texture'),
    [inspectorFields]
  );

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [editingVersion, setEditingVersion] = React.useState<VersionSummary | null>(null);

  const activeVersion = React.useMemo(
    () => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null,
    [versions, resource.activeVersion]
  );

  const { submitting: editSubmitting, setSubmitting: setEditSubmitting, error: editError, setError: setEditError, reset: resetEdit } = useFormState();
  const { submitting: createSubmitting, setSubmitting: setCreateSubmitting, error: createError, setError: setCreateError, reset: resetCreate } = useFormState();

  const [editComponentData, setEditComponentData] = React.useState<Record<string, unknown>>({});
  const [editTextureFilesByKey, setEditTextureFilesByKey] = React.useState<Record<string, TextureFileState>>({});

  const [createComponentData, setCreateComponentData] = React.useState<Record<string, unknown>>({});
  const [createTextureFilesByKey, setCreateTextureFilesByKey] = React.useState<Record<string, TextureFileState>>({});
  const [createZip, setCreateZip] = React.useState<File | null>(null);

  const cleanupTextureFiles = React.useCallback((files: Record<string, TextureFileState>) => {
    for (const tf of Object.values(files)) {
      try {
        URL.revokeObjectURL(tf.blobUrl);
      } catch { }
    }
  }, []);

  const setTextureFieldFile = React.useCallback(
    (
      fieldKey: string,
      file: File | null,
      setFiles: React.Dispatch<React.SetStateAction<Record<string, TextureFileState>>>,
      setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
    ) => {
      const blobUrl = file ? URL.createObjectURL(file) : null;

      setFiles((prev) => {
        const next = { ...prev };
        const existing = next[fieldKey];
        if (existing) {
          try {
            URL.revokeObjectURL(existing.blobUrl);
          } catch { }
        }

        if (!file) {
          delete next[fieldKey];
        } else {
          next[fieldKey] = { file, blobUrl: blobUrl! };
        }
        return next;
      });

      setData((prev) => {
        const next = { ...prev };
        if (!file) {
          delete next[fieldKey];
        } else {
          next[fieldKey] = blobUrl!;
        }
        return next;
      });
    },
    []
  );

  React.useEffect(() => {
    if (!editingVersion) return;

    resetEdit();
    setEditComponentData(parseComponentData(editingVersion.componentData));

    // reset file selection
    cleanupTextureFiles(editTextureFilesByKey);
    setEditTextureFilesByKey({});
  }, [editingVersion, resetEdit, cleanupTextureFiles]);

  React.useEffect(() => {
    if (!creatingOpen) return;

    resetCreate();
    setCreateZip(null);

    const seed = activeVersion ? parseComponentData(activeVersion.componentData) : {};
    setCreateComponentData(seed);

    cleanupTextureFiles(createTextureFilesByKey);
    setCreateTextureFilesByKey({});
  }, [creatingOpen, activeVersion, resetCreate, cleanupTextureFiles]);

  React.useEffect(() => {
    return () => {
      cleanupTextureFiles(editTextureFilesByKey);
      cleanupTextureFiles(createTextureFilesByKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEditVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    setEditError(null);
    setEditSubmitting(true);

    setEditSubmitting(true);

    try {
      const files: Record<string, File> = {};
      for (const [slot, tf] of Object.entries(editTextureFilesByKey)) {
        files[slot] = tf.file;
      }

      await updateResourceVersionWithFiles({
        resourceId: resource.id,
        version: editingVersion.version,
        componentData: editComponentData ?? {},
        files,
      });

      setEditingVersion(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Unknown error');
      setEditSubmitting(false);
    }
  };

  const submitCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();

    setCreateError(null);
    setCreateSubmitting(true);

    try {
      let zipFile: File;

      if (createZip) {
        zipFile = createZip;
      } else {
        const files: Record<string, File> = {};
        for (const [key, tf] of Object.entries(createTextureFilesByKey)) {
          files[key] = tf.file;
        }

        const zipBlob = await createUploadZip({
          kind: resource.kind,
          componentData: createComponentData,
        }, files);

        zipFile = new File([zipBlob], `material-${resource.id}.zip`, { type: 'application/zip' });
      }

      await AdminService.postApiAdminResourcesVersions(resource.id, {
        zip: zipFile,
      });

      setCreatingOpen(false);
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
      setCreateSubmitting(false);
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
          onEdit={(v) => setEditingVersion(v)}
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

      {/* Create version dialog */}
      <ResourceDialogLayout
        open={creatingOpen}
        onOpenChange={setCreatingOpen}
        title="Create / Upload Version"
        subtitle="Newly created version becomes active"
        onClose={() => setCreatingOpen(false)}
        fullscreen={true}
        className="max-w-4xl"
      >
        <div className="flex h-full">
          <ResourceDialogFormPanel onSubmit={submitCreateVersion} error={createError}>
            <div className="space-y-2">
              <Label>ZIP upload (optional)</Label>
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => setCreateZip(e.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-neutral-600">
                If provided, ZIP takes precedence over the fields below.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-bold">Component properties</div>
                <p className="text-xs text-neutral-600">Driven by ECS inspector metadata.</p>
              </div>

              <EcsInspectorFieldsForm
                fields={inspectorFields}
                value={createComponentData}
                onChange={setCreateComponentData}
                hideTypes={['texture']}
              />

              {textureFields.length ? (
                <div className="space-y-4">
                  <div className="font-bold">Textures</div>
                  <EcsInspectorFieldsForm
                    fields={textureFields}
                    value={createComponentData}
                    onChange={setCreateComponentData}
                    textureFilesByKey={createTextureFilesByKey}
                    onPickTextureFile={(fieldKey, file) =>
                      setTextureFieldFile(fieldKey, file, setCreateTextureFilesByKey, setCreateComponentData)
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? 'Creating…' : 'Create version'}
              </Button>
            </div>
          </ResourceDialogFormPanel>

          <ResourceDialogPreviewPanel>
            <MaterialPreview
              resourceKey={resource.key}
              kind={resource.kind}
              componentData={createComponentData}
              className="h-full w-full"
            />
          </ResourceDialogPreviewPanel>
        </div>
      </ResourceDialogLayout>

      {/* Edit version dialog */}
      <ResourceDialogLayout
        open={!!editingVersion}
        onOpenChange={(open) => {
          if (!open) setEditingVersion(null);
        }}
        title={`Edit version ${editingVersion ? `v${editingVersion.version}` : ''}`}
        subtitle="Updates componentData and optional bindings"
        onClose={() => setEditingVersion(null)}
        fullscreen={true}
        className="max-w-4xl"
      >
        <div className="flex h-full">
          <ResourceDialogFormPanel onSubmit={submitEditVersion} error={editError}>
            <div className="space-y-3">
              <div>
                <div className="font-bold">Component properties</div>
                <p className="text-xs text-neutral-600">Driven by ECS inspector metadata.</p>
              </div>

              <EcsInspectorFieldsForm
                fields={inspectorFields}
                value={editComponentData}
                onChange={setEditComponentData}
                hideTypes={['texture']}
              />

              {textureFields.length ? (
                <div className="space-y-4">
                  <div className="font-bold">Textures</div>
                  <EcsInspectorFieldsForm
                    fields={textureFields}
                    value={editComponentData}
                    onChange={setEditComponentData}
                    textureFilesByKey={editTextureFilesByKey}
                    onPickTextureFile={(fieldKey, file) =>
                      setTextureFieldFile(fieldKey, file, setEditTextureFilesByKey, setEditComponentData)
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </ResourceDialogFormPanel>

          <ResourceDialogPreviewPanel>
            <MaterialPreview
              resourceKey={resource.key}
              kind={resource.kind}
              componentData={editComponentData}
              className="h-full w-full"
            />
          </ResourceDialogPreviewPanel>
        </div>
      </ResourceDialogLayout>
    </div>
  );
}
