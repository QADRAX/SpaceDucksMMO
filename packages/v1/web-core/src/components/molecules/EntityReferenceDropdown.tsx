'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

export type EntityReferenceOption = {
  id: string;
  label: string;
  depth: number;
  icon?: string | null;
};

export function EntityReferenceDropdown(props: {
  value: string | null;
  options: EntityReferenceOption[];
  onChange: (next: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { value, options, onChange, disabled, placeholder } = props;

  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');

  const selected = React.useMemo(() => {
    if (!value) return null;
    return options.find((o) => o.id === value) ?? null;
  }, [options, value]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const a = (o.label ?? '').toLowerCase();
      const b = (o.id ?? '').toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [options, filter]);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={!!disabled}
        className="w-full justify-between"
      >
        <span className="truncate">
          {selected ? selected.label : value ? value : placeholder ?? 'Select entity…'}
        </span>
        <span aria-hidden="true">▾</span>
      </Button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-base border-2 border-border bg-white p-2">
          <div className="space-y-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              disabled={!!disabled}
            />

            <div className="max-h-64 overflow-y-auto">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-base px-2 py-2 text-left text-sm hover:bg-neutral-100"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                disabled={!!disabled}
              >
                <div className="h-5 w-5 text-center text-xs opacity-80" aria-hidden>
                  
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">None</div>
                </div>
              </button>

              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-base px-2 py-2 text-left text-sm hover:bg-neutral-100"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  disabled={!!disabled}
                >
                  <div className="h-5 w-5 text-center text-xs opacity-80" aria-hidden>
                    {(o.icon ?? '').trim()}
                  </div>
                  <div className="min-w-0 flex-1" style={{ paddingLeft: o.depth * 12 }}>
                    <div className="truncate">{o.label}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{o.id}</div>
                  </div>
                </button>
              ))}

              {filtered.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">No matches.</div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
