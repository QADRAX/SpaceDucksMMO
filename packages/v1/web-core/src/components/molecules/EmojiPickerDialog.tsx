'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

import data from '@emoji-mart/data';

import { Button } from '@/components/atoms/Button';
import { Label } from '@/components/atoms/Label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/molecules/Dialog';

const EmojiMartPicker = dynamic(() => import('@emoji-mart/react').then((m: any) => m.default), {
  ssr: false,
  loading: () => <div className="p-3 text-sm text-muted-foreground">Loading…</div>,
}) as unknown as React.ComponentType<any>;

export function EmojiPickerDialog(props: {
  title: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  triggerLabel?: string;
  triggerAriaLabel?: string;
}) {
  const { title, value, onChange, disabled, triggerLabel, triggerAriaLabel } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} aria-label={triggerAriaLabel}>
          {triggerLabel ?? (value ? value : 'Choose…')}
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 w-full max-w-lg">
        <DialogHeader className="border-b border-border p-4 pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="p-3">
          <div className="flex items-center justify-between gap-3">
            <Label>Selected</Label>
            <div className="text-xl leading-none">{value || '—'}</div>
          </div>

          <div className="mt-3">
            <EmojiMartPicker
              data={data as any}
              onEmojiSelect={(emoji: any) => {
                const native = typeof emoji?.native === 'string' ? emoji.native : '';
                if (!native) return;
                onChange(native);
                setOpen(false);
              }}
              // Grid-only, WhatsApp-like.
              previewPosition="none"
              navPosition="none"
              searchPosition="none"
              perLine={11}
              emojiSize={20}
              emojiButtonSize={36}
              theme="light"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border p-4 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
