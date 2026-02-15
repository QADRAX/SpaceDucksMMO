'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { cn } from '@/lib/utils';
import { createEmptyEcsTreeSnapshot, safeParseEcsTreeSnapshot } from '@/lib/ecsSnapshot';

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
  kind: 'prefab' | 'scene';
  activeVersion: number;
};

function parseJsonOrNull(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function ResourceDetailEcsTreePanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [snapshotText, setSnapshotText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const editorHref = resource.kind === 'scene' ? `/admin/scenes/${resource.id}` : `/admin/prefabs/${resource.id}`;

  const activeVersion = React.useMemo(
    () => versions.find((v) => v.version === resource.activeVersion) ?? versions[0] ?? null,
    [versions, resource.activeVersion]
  );

  const activeSnapshot = React.useMemo(() => {
    const fallback = createEmptyEcsTreeSnapshot();
    const raw = activeVersion?.componentData;
    if (!raw) return fallback;
    const parsed = safeParseEcsTreeSnapshot(parseJsonOrNull(raw));
    return parsed.ok ? parsed.data : fallback;
  }, [activeVersion]);

  const snapshotStats = React.useMemo(() => {
    const parsed = safeParseEcsTreeSnapshot(parseJsonOrNull(snapshotText));
    if (!parsed.ok) {
      return {
        ok: false as const,
        message: parsed.error.issues?.[0]?.message ?? 'Invalid snapshot',
      };
    }
    return {
      ok: true as const,
      roots: parsed.data.rootIds.length,
      entities: parsed.data.entities.length,
      activeCameraEntityId: parsed.data.activeCameraEntityId ?? null,
    };
  }, [snapshotText]);

  React.useEffect(() => {
    if (!creatingOpen) return;
    setSnapshotText(JSON.stringify(activeSnapshot, null, 2));
    setError(null);
    setSubmitting(false);
  }, [creatingOpen, activeSnapshot]);

  React.useEffect(() => {
    if (creatingOpen) return;
    setError(null);
    setSubmitting(false);
  }, [creatingOpen]);

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

    const parsed = safeParseEcsTreeSnapshot(parseJsonOrNull(snapshotText));
    if (!parsed.ok) {
      setError(parsed.error.issues?.[0]?.message ?? 'Invalid snapshot');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set('componentData', JSON.stringify(parsed.data, null, 2));

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
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => router.push(editorHref)}>
              Open editor
            </Button>
            <Button type="button" size="sm" onClick={() => setCreatingOpen(true)}>
              + Create version
            </Button>
          </div>
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
        <DialogContent fullscreen className="bg-white">
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-600">Create</div>
                <div className="text-xl font-heading">New {resource.kind} version</div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreatingOpen(false)} disabled={submitting}>
                  Close
                </Button>
              </div>
            </div>

            <form onSubmit={submitNewVersion} className="flex min-h-0 flex-1">
              <div className="w-full max-w-2xl border-r border-border overflow-auto scrollbar p-6">
                <div className="space-y-4">
                  {error ? (
                    <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                      <strong>Error:</strong> {error}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Snapshot (ECS Tree)</Label>
                    <textarea
                      value={snapshotText}
                      onChange={(e) => setSnapshotText(e.target.value)}
                      spellCheck={false}
                      className={cn(
                        'min-h-105 w-full rounded-base border-2 border-border bg-white px-3 py-2 text-xs font-mono',
                        'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 shadow-base'
                      )}
                    />
                    <div className="text-xs text-neutral-600">
                      {snapshotStats.ok ? (
                        <>
                          Roots: <span className="font-bold text-black">{snapshotStats.roots}</span> · Entities:{' '}
                          <span className="font-bold text-black">{snapshotStats.entities}</span>
                          {snapshotStats.activeCameraEntityId ? (
                            <>
                              {' '}
                              · Active camera: <span className="font-mono">{snapshotStats.activeCameraEntityId}</span>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>Invalid snapshot: {snapshotStats.message}</>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating…' : 'Create version'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1 p-6 overflow-auto">
                <div className="text-sm font-heading">Active snapshot</div>
                <div className="mt-2 text-sm text-neutral-700 space-y-2">
                  <div>
                    Roots: <span className="font-bold">{activeSnapshot.rootIds.length}</span> · Entities:{' '}
                    <span className="font-bold">{activeSnapshot.entities.length}</span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    Use <span className="font-bold text-black">Open editor</span> to edit in the Unity-like UI (Hierarchy + Inspector + Play Mode).
                  </div>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
