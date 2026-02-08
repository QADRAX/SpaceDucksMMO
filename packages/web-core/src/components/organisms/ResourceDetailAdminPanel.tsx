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
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Card } from '@/components/molecules/Card';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';
import { MaterialResourcePreview } from '@/components/organisms/MaterialResourcePreview';

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
  key: string;
  displayName: string;
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

function parseComponentData(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw ?? '{}');
    if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}

export function ResourceDetailAdminPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();

  const inspectorFields = React.useMemo(() => getMaterialInspectorFields(resource.kind), [resource.kind]);
  const textureFields = React.useMemo(
    () => inspectorFields.filter((f) => f.type === 'texture'),
    [inspectorFields]
  );

  const [displayName, setDisplayName] = React.useState(resource.displayName);
  const [key, setKey] = React.useState(resource.key);
  const [savingResource, setSavingResource] = React.useState(false);
  const [resourceError, setResourceError] = React.useState<string | null>(null);

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [editingVersion, setEditingVersion] = React.useState<VersionSummary | null>(null);

  const activeVersion = React.useMemo(
    () => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null,
    [versions, resource.activeVersion]
  );

  const [editComponentData, setEditComponentData] = React.useState<Record<string, unknown>>({});
  const [editTextureFilesByKey, setEditTextureFilesByKey] = React.useState<Record<string, TextureFileState>>({});
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const [createComponentData, setCreateComponentData] = React.useState<Record<string, unknown>>({});
  const [createTextureFilesByKey, setCreateTextureFilesByKey] = React.useState<Record<string, TextureFileState>>({});
  const [createZip, setCreateZip] = React.useState<File | null>(null);
  const [createSubmitting, setCreateSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const cleanupTextureFiles = React.useCallback((files: Record<string, TextureFileState>) => {
    for (const tf of Object.values(files)) {
      try {
        URL.revokeObjectURL(tf.blobUrl);
      } catch {}
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
          } catch {}
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
    // Keep local inputs in sync when navigating.
    setDisplayName(resource.displayName);
    setKey(resource.key);
  }, [resource.displayName, resource.key]);

  React.useEffect(() => {
    if (!editingVersion) return;

    setEditError(null);
    setEditSubmitting(false);
    setEditComponentData(parseComponentData(editingVersion.componentData));

    // reset file selection
    cleanupTextureFiles(editTextureFilesByKey);
    setEditTextureFilesByKey({});
  }, [editingVersion]);

  React.useEffect(() => {
    if (!creatingOpen) return;

    setCreateError(null);
    setCreateSubmitting(false);
    setCreateZip(null);

    const seed = activeVersion ? parseComponentData(activeVersion.componentData) : {};
    setCreateComponentData(seed);

    cleanupTextureFiles(createTextureFilesByKey);
    setCreateTextureFilesByKey({});
  }, [creatingOpen]);

  React.useEffect(() => {
    return () => {
      cleanupTextureFiles(editTextureFilesByKey);
      cleanupTextureFiles(createTextureFilesByKey);
    };
  }, []);

  const patchResource = async () => {
    setResourceError(null);
    setSavingResource(true);
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          key: key.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && (json.error as string)) || `Failed to update resource (${res.status})`);
      }

      router.refresh();
    } catch (err) {
      setResourceError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingResource(false);
    }
  };

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

  const deleteResource = async () => {
    const ok = confirm('Delete this resource? This will delete all its versions.');
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && (json.error as string)) || `Failed to delete resource (${res.status})`);
      }

      router.push('/admin/resources');
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

  const submitEditVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;

    setEditError(null);
    setEditSubmitting(true);

    try {
      const form = new FormData();
      form.set('componentData', JSON.stringify(editComponentData ?? {}, null, 2));

      for (const [slot, tf] of Object.entries(editTextureFilesByKey)) {
        form.set(slot, tf.file);
      }

      const res = await fetch(`/api/admin/resources/${resource.id}/versions/${editingVersion.version}`, {
        method: 'PATCH',
        body: form,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error as string)) || `Failed to update version (${res.status})`;
        throw new Error(msg);
      }

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
      const form = new FormData();
      if (createZip) {
        form.set('zip', createZip);
      } else {
        form.set('componentData', JSON.stringify(createComponentData ?? {}, null, 2));
        for (const [slot, tf] of Object.entries(createTextureFilesByKey)) {
          form.set(slot, tf.file);
        }
      }

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
      setCreateError(err instanceof Error ? err.message : 'Unknown error');
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="w-full max-w-xl space-y-4">
            <div className="font-heading">Edit resource</div>

            {resourceError ? (
              <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                <strong>Error:</strong> {resourceError}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Key</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} />
              <p className="text-xs text-neutral-600">Changing the key affects engine resolve lookups.</p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" onClick={patchResource} disabled={savingResource}>
                {savingResource ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" onClick={deleteResource}>
                Delete resource
              </Button>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <div className="font-heading">New version</div>
            <div className="text-sm text-neutral-600 mt-1">
              Create a new version from ZIP or from edited fields.
            </div>
            <div className="h-3" />
            <Button type="button" onClick={() => setCreatingOpen(true)}>
              + Create / Upload version
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Bindings</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-neutral-600">No versions yet.</p>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>v{v.version}</TableCell>
                  <TableCell>{resource.activeVersion === v.version ? '✓' : ''}</TableCell>
                  <TableCell>
                    <code className="text-xs">{v.componentType}</code>
                  </TableCell>
                  <TableCell>{v.bindings.length}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {resource.activeVersion !== v.version ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setActiveVersion(v.version)}
                        >
                          Set active
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" disabled>
                          Active
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingVersion(v)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => deleteVersion(v.version)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create version dialog */}
      <Dialog open={creatingOpen} onOpenChange={setCreatingOpen}>
        <DialogContent className="p-0 w-full max-w-4xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-heading">Create / Upload version</div>
                <div className="text-sm text-neutral-600 mt-1">Newly created version becomes active.</div>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setCreatingOpen(false)} disabled={createSubmitting}>
                Close
              </Button>
            </div>
          </div>

          <div className="flex min-h-0">
            <div className="w-full max-w-xl border-r border-border overflow-auto scrollbar p-6">
              <form className="space-y-6" onSubmit={submitCreateVersion}>
                {createError ? (
                  <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                    <strong>Error:</strong> {createError}
                  </div>
                ) : null}

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
                    hideTypes={['texture', 'reference', 'enum']}
                  />

                  {textureFields.length ? (
                    <div className="space-y-4">
                      <div className="font-bold">Textures</div>
                      {textureFields.map((f) => {
                        const current = createComponentData[f.key];
                        const selected = createTextureFilesByKey[f.key];
                        return (
                          <div key={f.key} className="space-y-2">
                            <Label>{f.label ?? f.key}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setTextureFieldFile(f.key, file, setCreateTextureFilesByKey, setCreateComponentData);
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setTextureFieldFile(f.key, null, setCreateTextureFilesByKey, setCreateComponentData)}
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
                                  if (selected) {
                                    setTextureFieldFile(f.key, null, setCreateTextureFilesByKey, setCreateComponentData);
                                  }
                                  setCreateComponentData((prev) => ({ ...prev, [f.key]: v || undefined }));
                                }}
                                placeholder="catalog id or URL (optional)"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={createSubmitting}>
                    {createSubmitting ? 'Creating…' : 'Create version'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="min-w-0 flex-1 bg-bg">
              <MaterialResourcePreview kind={resource.kind} componentData={createComponentData} className="h-full w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit version dialog */}
      <Dialog
        open={!!editingVersion}
        onOpenChange={(open) => {
          if (!open) setEditingVersion(null);
        }}
      >
        <DialogContent className="p-0 w-full max-w-4xl">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl font-heading">Edit version {editingVersion ? `v${editingVersion.version}` : ''}</div>
                <div className="text-sm text-neutral-600 mt-1">Updates componentData and optional bindings.</div>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingVersion(null)} disabled={editSubmitting}>
                Close
              </Button>
            </div>
          </div>

          <div className="flex min-h-0">
            <div className="w-full max-w-xl border-r border-border overflow-auto scrollbar p-6">
              <form className="space-y-6" onSubmit={submitEditVersion}>
                {editError ? (
                  <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                    <strong>Error:</strong> {editError}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div>
                    <div className="font-bold">Component properties</div>
                    <p className="text-xs text-neutral-600">Driven by ECS inspector metadata.</p>
                  </div>

                  <EcsInspectorFieldsForm
                    fields={inspectorFields}
                    value={editComponentData}
                    onChange={setEditComponentData}
                    hideTypes={['texture', 'reference', 'enum']}
                  />

                  {textureFields.length ? (
                    <div className="space-y-4">
                      <div className="font-bold">Textures</div>
                      {textureFields.map((f) => {
                        const current = editComponentData[f.key];
                        const selected = editTextureFilesByKey[f.key];
                        return (
                          <div key={f.key} className="space-y-2">
                            <Label>{f.label ?? f.key}</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setTextureFieldFile(f.key, file, setEditTextureFilesByKey, setEditComponentData);
                                }}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setTextureFieldFile(f.key, null, setEditTextureFilesByKey, setEditComponentData)}
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
                                  if (selected) {
                                    setTextureFieldFile(f.key, null, setEditTextureFilesByKey, setEditComponentData);
                                  }
                                  setEditComponentData((prev) => ({ ...prev, [f.key]: v || undefined }));
                                }}
                                placeholder="catalog id or URL (optional)"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={editSubmitting}>
                    {editSubmitting ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="min-w-0 flex-1 bg-bg">
              <MaterialResourcePreview kind={resource.kind} componentData={editComponentData} className="h-full w-full" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
