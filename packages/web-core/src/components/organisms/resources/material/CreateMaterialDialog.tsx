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
import { ResourceDialogLayout, ResourceDialogFormPanel, ResourceDialogPreviewPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { MaterialPreview } from '@/components/molecules/previews/MaterialPreview';
import { useFormState } from '@/hooks/useFormState';
import { createUploadZip } from '@/lib/resource-zip';

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

function initialComponentData(fields: InspectorFieldConfig<any, unknown>[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.default !== undefined) data[f.key] = f.default;
  }
  return data;
}



export function CreateMaterialDialog({
  kind,
  kindLabel,
}: {
  kind: MaterialResourceKind;
  kindLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const draftPreviewKeyRef = React.useRef(
    `draft:${kind}:${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())}`
  );

  const { submitting, setSubmitting, error, setError, reset } = useFormState();

  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');

  const inspectorFields = React.useMemo(() => getMaterialInspectorFields(kind), [kind]);
  const textureFields = React.useMemo(
    () => inspectorFields.filter((f) => f.type === 'texture'),
    [inspectorFields]
  );

  const [componentData, setComponentData] = React.useState<Record<string, unknown>>(() =>
    initialComponentData(inspectorFields)
  );
  const [textureFilesByKey, setTextureFilesByKey] = React.useState<Record<string, TextureFileState>>({});

  React.useEffect(() => {
    // Reset defaults when switching kind (fields come from metadata).
    setComponentData(initialComponentData(inspectorFields));
    setTextureFilesByKey({});
  }, [inspectorFields]);

  React.useEffect(() => {
    // Cleanup blob URLs when closing/resetting
    if (open) return;

    for (const tf of Object.values(textureFilesByKey)) {
      try {
        URL.revokeObjectURL(tf.blobUrl);
      } catch { }
    }

    setKey('');
    setDisplayName('');
    setComponentData(initialComponentData(inspectorFields));
    setTextureFilesByKey({});
    reset();
  }, [open, inspectorFields, reset]);

  const setTextureFieldFile = React.useCallback(
    (fieldKey: string, file: File | null) => {
      const blobUrl = file ? URL.createObjectURL(file) : null;

      setTextureFilesByKey((prev) => {
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

      setComponentData((prev) => {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !displayName.trim()) {
      setError('Key and Display Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const files: Record<string, File> = {};
      for (const [fieldKey, tf] of Object.entries(textureFilesByKey)) {
        files[fieldKey] = tf.file;
      }

      const zipBlob = await createUploadZip({
        kind,
        key: key.trim(),
        displayName: displayName.trim(),
        componentData,
      }, files);

      const zipFile = new File([zipBlob], `${key.trim() || kind}.zip`, { type: 'application/zip' });

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
          <ResourceKeyInput value={key} onChange={setKey} placeholder="standardMaterial/moon" disabled={submitting} />
          <ResourceDisplayNameInput value={displayName} onChange={setDisplayName} placeholder="Moon Material" disabled={submitting} />

          <div className="space-y-3">
            <div>
              <div className="font-bold">Material</div>
              <p className="text-xs text-neutral-600">
                Fields are driven by the ECS component inspector metadata.
              </p>
            </div>

            <EcsInspectorFieldsForm
              fields={inspectorFields}
              value={componentData}
              onChange={setComponentData}
              hideTypes={['texture']}
            />

            {textureFields.length ? (
              <div className="space-y-4">
                <div className="font-bold">Textures</div>
                <EcsInspectorFieldsForm
                  fields={textureFields}
                  value={componentData}
                  onChange={setComponentData}
                  textureFilesByKey={textureFilesByKey}
                  onPickTextureFile={setTextureFieldFile}
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </ResourceDialogFormPanel>

        <ResourceDialogPreviewPanel>
          <div className="h-full w-full">
            <MaterialPreview
              resourceKey={key.trim() ? key : draftPreviewKeyRef.current}
              kind={kind}
              componentData={componentData}
              className="h-full w-full"
            />
          </div>
        </ResourceDialogPreviewPanel>
      </ResourceDialogLayout>
    </>
  );
}
