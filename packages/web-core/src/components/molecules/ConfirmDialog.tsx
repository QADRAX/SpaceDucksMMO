'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'link';
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  onConfirm,
}: Props) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-full max-w-lg">
        <div className="p-6 border-b border-border">
          <div className="text-xl font-heading">{title}</div>
          {description ? <div className="text-sm text-neutral-600 mt-2">{description}</div> : null}
        </div>

        <div className="p-6">
          {error ? (
            <div className="mb-4 p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
              <strong>Error:</strong> {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={async () => {
                setError(null);
                setSubmitting(true);
                try {
                  await onConfirm();
                  onOpenChange(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed');
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
