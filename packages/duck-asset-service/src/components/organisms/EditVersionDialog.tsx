'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/molecules/Dialog';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';

interface EditVersionDialogProps {
  trigger?: React.ReactNode;
  version: {
    id: string;
    version: string;
    status: string;
    notes: string | null;
    isDefault: boolean;
  };
  assetId: string;
  onVersionUpdated?: () => void;
}

export function EditVersionDialog({
  trigger,
  version,
  assetId,
  onVersionUpdated,
}: EditVersionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: version.status,
    notes: version.notes || '',
  });

  // Auto-open when component mounts if trigger is hidden
  React.useEffect(() => {
    if (trigger && (trigger as any).props?.style?.display === 'none') {
      setOpen(true);
    }
  }, [trigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/assets/${assetId}/versions/${version.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update version');
      }

      onVersionUpdated?.();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clone the trigger and add onClick handler
  const triggerElement = trigger ? (
    React.cloneElement(trigger as React.ReactElement, {
      onClick: () => setOpen(true)
    })
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
      Edit
    </Button>
  );

  return (
    <>
      {triggerElement}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Edit Version {version.version}</h2>
            <p className="text-sm opacity-70">Update version metadata</p>
          </div>

          {error && (
            <div className="rounded-md border-2 border-red-500 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional version notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t-2 border-black pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
