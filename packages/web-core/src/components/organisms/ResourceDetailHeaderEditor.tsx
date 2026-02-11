'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { getKindLabel, isKindInGroup, RESOURCE_GROUPS } from '@/lib/resourceGroups';

type Props = {
  resourceId: string;
  initialDisplayName: string;
  initialKey: string;
  kind: string;
  activeVersion?: number | null;
  thumbnailFileAssetId?: string | null;
};

export function ResourceDetailHeaderEditor({
  resourceId,
  initialDisplayName,
  initialKey,
  kind,
  activeVersion,
  thumbnailFileAssetId,
}: Props) {
  const router = useRouter();

  const resourceGroup = React.useMemo(
    () => RESOURCE_GROUPS.find((g) => isKindInGroup(g, kind)) ?? null,
    [kind]
  );
  const kindLabel = React.useMemo(
    () => (resourceGroup ? getKindLabel(resourceGroup, kind) : kind),
    [resourceGroup, kind]
  );

  const [displayName, setDisplayName] = React.useState(initialDisplayName);
  const [key, setKey] = React.useState(initialKey);

  const [editingName, setEditingName] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const keyInputRef = React.useRef<HTMLInputElement | null>(null);

  const trimmedName = displayName.trim();
  const trimmedKey = key.trim();

  React.useEffect(() => {
    // Keep values in sync after router.refresh() updates server props.
    if (editingName || editingKey) return;
    setDisplayName(initialDisplayName);
    setKey(initialKey);
  }, [initialDisplayName, initialKey, editingName, editingKey]);

  React.useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  React.useEffect(() => {
    if (editingKey) keyInputRef.current?.focus();
  }, [editingKey]);

  const savePatch = async (patch: { displayName?: string; key?: string }) => {
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/resources/${resourceId}` as string, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((json && (json.error as string)) || `Failed to update resource (${res.status})`);
      }

      setEditingName(false);
      setEditingKey(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const cancelName = () => {
    setDisplayName(initialDisplayName);
    setEditingName(false);
    setError(null);
  };

  const cancelKey = () => {
    setKey(initialKey);
    setEditingKey(false);
    setError(null);
  };

  const doDelete = async () => {
    const res = await fetch(`/api/admin/resources/${resourceId}` as string, { method: 'DELETE' });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((json && (json.error as string)) || `Failed to delete resource (${res.status})`);
    }

    router.push('/admin/resources');
    router.refresh();
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex items-start gap-4">
          <div className="shrink-0">
            {thumbnailFileAssetId ? (
              <img
                src={`/api/files/${thumbnailFileAssetId}`}
                alt={`${initialDisplayName} thumbnail`}
                className="w-14 h-14 rounded-base border border-border object-cover bg-bg"
                loading="lazy"
              />
            ) : (
              <div className="w-14 h-14 rounded-base border border-border bg-bg" />
            )}
          </div>

          <div className="min-w-0">
            <nav className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
              <Link href="/admin/resources" className="hover:underline">
                Resources
              </Link>
              <span className="text-neutral-300">/</span>
              {resourceGroup ? (
                <>
                  <Link href={`/admin/resources/group/${resourceGroup.id}`} className="hover:underline">
                    {resourceGroup.label}
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <Link href={`/admin/resources/group/${resourceGroup.id}/${kind}`} className="hover:underline">
                    {kindLabel}
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <span className="font-mono text-neutral-700">{initialKey}</span>
                </>
              ) : (
                <>
                  <span className="font-mono">{kind}</span>
                  <span className="text-neutral-300">/</span>
                  <span className="font-mono text-neutral-700">{initialKey}</span>
                </>
              )}
            </nav>

            <div className="mt-3">
              <div className="relative h-8 w-full max-w-[min(720px,60vw)]">
                <button
                  type="button"
                  className={
                    'absolute inset-0 flex items-center text-left text-xl font-heading truncate hover:underline ' +
                    (editingName ? 'opacity-0 pointer-events-none' : 'opacity-100')
                  }
                  onClick={() => {
                    setError(null);
                    setEditingKey(false);
                    setEditingName(true);
                  }}
                  disabled={saving}
                  title="Click to edit display name"
                >
                  {trimmedName || 'Untitled'}
                </button>

                <Input
                  ref={nameInputRef as any}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={saving}
                  className={
                    'absolute inset-0 h-full w-full text-xl font-heading px-0 py-0 rounded-none bg-transparent shadow-none ' +
                    'border-0 focus-visible:ring-0 focus-visible:ring-offset-0 underline decoration-2 underline-offset-4 decoration-transparent focus:decoration-black ' +
                    (editingName ? 'opacity-100' : 'opacity-0 pointer-events-none')
                  }
                  title="Enter to save • Esc or blur to cancel"
                  onBlur={() => {
                    if (saving) return;
                    cancelName();
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelName();
                      return;
                    }
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if (!trimmedName) {
                      setError('Display name is required.');
                      return;
                    }
                    if (trimmedName === initialDisplayName) {
                      setEditingName(false);
                      return;
                    }
                    try {
                      await savePatch({ displayName: trimmedName });
                    } catch {
                      // keep editing open on error
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600 min-w-0">
              <span className="text-neutral-500 shrink-0">Key:</span>
              <div className="relative h-9 min-w-0 flex-1 max-w-[min(520px,60vw)]">
                <button
                  type="button"
                  className={
                    'absolute inset-0 flex items-center text-left font-mono truncate hover:underline w-full ' +
                    (editingKey ? 'opacity-0 pointer-events-none' : 'opacity-100')
                  }
                  onClick={() => {
                    setError(null);
                    setEditingName(false);
                    setEditingKey(true);
                  }}
                  disabled={saving}
                  title="Click to edit key"
                >
                  {trimmedKey}
                </button>

                <Input
                  ref={keyInputRef as any}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  disabled={saving}
                  className={
                    'absolute inset-0 h-full w-full font-mono px-0 py-0 rounded-none bg-transparent shadow-none ' +
                    'border-0 focus-visible:ring-0 focus-visible:ring-offset-0 underline decoration-2 underline-offset-4 decoration-transparent focus:decoration-black ' +
                    (editingKey ? 'opacity-100' : 'opacity-0 pointer-events-none')
                  }
                  title="Enter to save • Esc or blur to cancel"
                  onBlur={() => {
                    if (saving) return;
                    cancelKey();
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelKey();
                      return;
                    }
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if (!trimmedKey) {
                      setError('Key is required.');
                      return;
                    }
                    if (trimmedKey === initialKey) {
                      setEditingKey(false);
                      return;
                    }
                    try {
                      await savePatch({ key: trimmedKey });
                    } catch {
                      // keep editing open on error
                    }
                  }}
                />
              </div>
            </div>

            <div className="mt-1 text-xs text-neutral-500 font-mono break-all">ID: {resourceId}</div>

            {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Delete resource"
            title="Delete resource"
            disabled={saving}
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete resource?"
        description={
          <span>
            This will permanently delete <span className="font-bold">{initialDisplayName}</span> and all its versions.
          </span>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={doDelete}
      />
    </>
  );
}
