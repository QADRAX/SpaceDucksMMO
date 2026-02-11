'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import JSZip from 'jszip';

import {
  BasicMaterialComponent,
  LambertMaterialComponent,
  PhongMaterialComponent,
  StandardMaterialComponent,
  type InspectorFieldConfig,
} from '@duckengine/ecs';

import type { MaterialResourceKind } from '@/lib/types';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import {
  Dialog,
  DialogContent,
} from '@/components/molecules/Dialog';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import { MaterialResourcePreview } from '@/components/organisms/MaterialResourcePreview';

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

function ensureUniqueBasename(name: string, used: Set<string>): string {
  const safe = (name || 'file').replace(/\\/g, '/').split('/').pop() || 'file';
  const dot = safe.lastIndexOf('.');
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';

  let candidate = `${base}${ext}`;
  let i = 1;
  while (used.has(candidate)) {
    candidate = `${base}-${i}${ext}`;
    i++;
  }
  used.add(candidate);
  return candidate;
}

export function CreateMaterialResourceDialog({
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

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      } catch {}
    }

    setKey('');
    setDisplayName('');
    setComponentData(initialComponentData(inspectorFields));
    setTextureFilesByKey({});
    setError(null);
    setSubmitting(false);
  }, [open]);

  const setTextureFieldFile = React.useCallback(
    (fieldKey: string, file: File | null) => {
      const blobUrl = file ? URL.createObjectURL(file) : null;

      setTextureFilesByKey((prev) => {
        const next = { ...prev };
        const existing = next[fieldKey];
        if (existing) {
          try {
            URL.revokeObjectURL(existing.blobUrl);
          } catch {}
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
      const zip = new JSZip();

      const usedFileNames = new Set<string>();
      const fileBindings: Array<{ slot: string; file: string }> = [];

      for (const [fieldKey, tf] of Object.entries(textureFilesByKey)) {
        const uniqueName = ensureUniqueBasename(tf.file.name, usedFileNames);
        zip.file(uniqueName, tf.file);
        fileBindings.push({ slot: fieldKey, file: uniqueName });
      }

      const manifest = {
        kind,
        key: key.trim(),
        displayName: displayName.trim(),
        version: {
          version: 1,
          componentData,
          files: fileBindings,
        },
      };

      zip.file('resource.json', JSON.stringify(manifest, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
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
                  <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="standardMaterial/moon" />
                  <p className="text-xs text-neutral-600">Unique stable id. Used by the engine.</p>
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Moon Material" />
                </div>

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
                    hideTypes={['texture', 'reference', 'enum']}
                  />

                  {textureFields.length ? (
                    <div className="space-y-4">
                      <div className="font-bold">Textures</div>
                      {textureFields.map((f) => {
                        const current = componentData[f.key];
                        const selected = textureFilesByKey[f.key];
                        return (
                          <div key={f.key} className="space-y-2">
                            <Label>{f.label ?? f.key}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setTextureFieldFile(f.key, file);
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setTextureFieldFile(f.key, null)}
                                disabled={!selected}
                              >
                                Clear
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-neutral-600">
                                {selected ? `Selected: ${selected.file.name}` : 'No file selected'}
                              </div>
                              <Input
                                value={typeof current === 'string' ? current : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  // Manual override: clear file selection.
                                  if (selected) setTextureFieldFile(f.key, null);
                                  setComponentData((prev) => ({ ...prev, [f.key]: v || undefined }));
                                }}
                                placeholder="catalog id or URL (optional)"
                              />
                            </div>
                            {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="min-w-0 flex-1 bg-bg">
              <div className="h-full w-full">
                <MaterialResourcePreview
                  resourceKey={key.trim() ? key : draftPreviewKeyRef.current}
                  kind={kind}
                  componentData={componentData}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
