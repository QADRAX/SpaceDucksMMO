'use client';

import * as React from 'react';
import { useFormState } from '@/hooks/useFormState';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { ResourceDialogLayout, ResourceDialogFormPanel } from '@/components/molecules/resource-ui/ResourceDialogLayout';
import { ResourceKeyInput, ResourceDisplayNameInput } from '@/components/molecules/resource-ui/ResourceFormFields';

export function CreateEcsTreeDialog({
  kind,
  kindLabel,
  keyPlaceholder,
}: {
  kind: 'prefab' | 'scene';
  kindLabel: string;
  keyPlaceholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [key, setKey] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');

  const { submitting, setSubmitting, error, setError, reset } = useFormState();

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    reset();
  }, [open, reset]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!key.trim() || !displayName.trim()) {
      setError('Key and Display Name are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind,
          key: key.trim(),
          displayName: displayName.trim(),
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.error as string)) || `Failed to create resource (${res.status})`;
        throw new Error(msg);
      }

      const createdId = (json && (json.id as string)) || null;
      if (!createdId) {
        throw new Error('Resource created but missing id in response');
      }

      const href = kind === 'scene' ? `/admin/scenes/${createdId}` : `/admin/prefabs/${createdId}`;

      setOpen(false);
      router.push(href);
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
        fullscreen={false}
        className="max-w-2xl"
      >
        <ResourceDialogFormPanel onSubmit={onSubmit} error={error}>
          <ResourceKeyInput
            value={key}
            onChange={setKey}
            placeholder={keyPlaceholder ?? (kind === 'scene' ? 'scenes/level-1' : 'prefabs/enemies/duck')}
            disabled={submitting}
          />
          <ResourceDisplayNameInput
            value={displayName}
            onChange={setDisplayName}
            placeholder={kind === 'scene' ? 'Level 1' : 'Enemy Duck'}
            disabled={submitting}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm font-heading">Notes</div>
            <div className="mt-2 text-sm text-neutral-600 space-y-2">
              <p>
                Creating will initialize an empty {kindLabel.toLowerCase()} and take you straight to the editor.
              </p>
              <p>
                The first save will create a new version.
              </p>
            </div>
          </div>
        </ResourceDialogFormPanel>

        {/* No preview panel for ECS Tree creation */}
      </ResourceDialogLayout>
    </>
  );
}
