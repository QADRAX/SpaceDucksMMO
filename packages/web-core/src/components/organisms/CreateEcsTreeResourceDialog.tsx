'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';

export function CreateEcsTreeResourceDialog({
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

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) return;
    setKey('');
    setDisplayName('');
    setError(null);
    setSubmitting(false);
  }, [open]);

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

          <form onSubmit={onSubmit} className="flex min-h-0 flex-1">
            <div className="w-full max-w-xl border-r border-border overflow-auto scrollbar p-6">
              <div className="space-y-4">
                {error ? (
                  <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={keyPlaceholder ?? (kind === 'scene' ? 'scenes/level-1' : 'prefabs/enemies/duck')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={kind === 'scene' ? 'Level 1' : 'Enemy Duck'}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 p-6 overflow-auto">
              <div className="text-sm font-heading">Notes</div>
              <div className="mt-2 text-sm text-neutral-700 space-y-2">
                <p>
                  Creating will initialize an empty {kindLabel.toLowerCase()} and take you straight to the editor.
                </p>
                <p>
                  The first save will create a new version.
                </p>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
