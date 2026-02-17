'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import { ResourceVersionsTable } from '@/components/organisms/ResourceVersionsTable';
import { cn } from '@/lib/utils';
import { createEmptyEcsTreeSnapshot, safeParseEcsTreeSnapshot } from '@/lib/ecsSnapshot';
import { ResourceDetailHeader } from '@/components/molecules/resource-ui/ResourceDetailHeader';
import { ResourceDialogLayout, ResourceDialogFormPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { useResourceMutations } from '@/hooks/useResourceMutations';
import { useFormState } from '@/hooks/useFormState';
import { AdminService } from '@/lib/api';

import { VersionSummary, VersionBindingSummary } from '../types';

type ResourceSummary = {
  id: string;
  kind: 'prefab' | 'scene';
  activeVersion: number;
};

function parseJsonOrNull(text: string | null): unknown | null {
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function EcsTreeDetailPanel({
  resource,
  versions,
}: {
  resource: ResourceSummary;
  versions: VersionSummary[];
}) {
  const router = useRouter();
  const { setActiveVersion, deleteVersion, isBusy } = useResourceMutations(resource.id);

  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [snapshotText, setSnapshotText] = React.useState('');
  const { submitting, setSubmitting, error, setError, reset } = useFormState();

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
    reset();
  }, [creatingOpen, activeSnapshot, reset]);

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
      await AdminService.postApiAdminResourcesVersions(resource.id, {
        componentData: JSON.stringify(parsed.data, null, 2),
      });

      setCreatingOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
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
      >
        <Button type="button" size="sm" variant="secondary" onClick={() => router.push(editorHref)}>
          Open editor
        </Button>
      </ResourceDetailHeader>

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
        title={`New ${resource.kind} version`}
        subtitle="Create"
        onClose={() => setCreatingOpen(false)}
        fullscreen={false}
        className="max-w-5xl"
      >
        <div className="flex h-full">
          <ResourceDialogFormPanel onSubmit={submitNewVersion} error={error} className="w-full max-w-2xl border-r border-border">
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
          </ResourceDialogFormPanel>

          <div className="min-w-0 flex-1 p-6 overflow-auto bg-bg">
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
        </div>
      </ResourceDialogLayout>
    </div>
  );
}
