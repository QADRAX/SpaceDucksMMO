'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

import type { ResourceKind } from '@/lib/types';

type ResourceSummary = {
  id: string;
  key: string;
  kind: ResourceKind | (string & {});
  displayName: string;
  thumbnailFileAssetId?: string | null;
};

async function fetchResourcesByKind(kind: string): Promise<ResourceSummary[]> {
  const res = await fetch(`/api/admin/resources?kind=${encodeURIComponent(kind)}`);
  if (!res.ok) throw new Error(`Failed to list resources (${res.status})`);
  const json = (await res.json()) as any;
  const data = Array.isArray(json?.data) ? (json.data as any[]) : [];
  return data
    .map((r) => ({
      id: String(r.id),
      key: String(r.key),
      kind: String(r.kind),
      displayName: String(r.displayName ?? r.key ?? ''),
      thumbnailFileAssetId: r.thumbnailFileAssetId ?? null,
    }))
    .filter((r) => r.key);
}

export function ResourceKeyDropdown(props: {
  kinds: Array<ResourceKind | string>;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { kinds, value, onChange, disabled, placeholder } = props;

  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resources, setResources] = React.useState<ResourceSummary[]>([]);

  const kindsKey = React.useMemo(() => kinds.map(String).sort().join('|'), [kinds]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const lists = await Promise.all(kinds.map((k) => fetchResourcesByKind(String(k))));
        const merged = lists.flat();
        const uniq = new Map<string, ResourceSummary>();
        for (const r of merged) uniq.set(r.key, r);

        const sorted = Array.from(uniq.values()).sort((a, b) =>
          (a.displayName || a.key).localeCompare(b.displayName || b.key)
        );

        if (!cancelled) setResources(sorted);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load resources');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, kindsKey]);

  const selected = React.useMemo(() => {
    if (!value) return null;
    return resources.find((r) => r.key === value) ?? null;
  }, [resources, value]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((r) => {
      const a = (r.displayName ?? '').toLowerCase();
      const b = (r.key ?? '').toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [resources, filter]);

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
          {selected ? selected.displayName : value ? value : placeholder ?? 'Select resource…'}
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
              disabled={loading}
            />

            {error ? <div className="text-xs text-red-600">{error}</div> : null}
            {loading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}

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
                <div className="h-8 w-8 rounded-base border border-border bg-white" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">None</div>
                </div>
              </button>

              {filtered.map((r) => {
                const thumb = r.thumbnailFileAssetId ? `/api/files/${r.thumbnailFileAssetId}` : null;
                return (
                  <button
                    key={r.key}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-base px-2 py-2 text-left text-sm hover:bg-neutral-100"
                    onClick={() => {
                      onChange(r.key);
                      setOpen(false);
                    }}
                    disabled={!!disabled}
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-base border border-border bg-white">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{r.displayName || r.key}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.key}</div>
                    </div>
                  </button>
                );
              })}

              {!loading && filtered.length === 0 ? (
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
