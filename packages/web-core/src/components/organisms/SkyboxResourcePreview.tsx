'use client';

import * as React from 'react';

type ResolvedFile = {
  url: string;
  fileName?: string;
};

type ResolvedResource = {
  key: string;
  version: number;
  componentType: string;
  files: Record<string, ResolvedFile>;
};

type FaceSlot = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

const FACE_SLOTS: readonly FaceSlot[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

export function SkyboxResourcePreview({
  resourceKey,
  className,
}: {
  resourceKey: string;
  className?: string;
}) {
  const [resolved, setResolved] = React.useState<ResolvedResource | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setResolved(null);

    (async () => {
      try {
        const url = new URL('/api/engine/resources/resolve', window.location.origin);
        url.searchParams.set('key', resourceKey);
        url.searchParams.set('version', 'active');

        const res = await fetch(url.toString(), { method: 'GET' });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = (json && (json.error as string)) || `Failed to resolve resource (${res.status})`;
          throw new Error(msg);
        }

        if (cancelled) return;
        setResolved(json as ResolvedResource);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resourceKey]);

  return (
    <div className={className ?? ''}>
      <div className="h-full w-full bg-bg flex flex-col">
        <div className="shrink-0 px-4 py-3 border-b border-border bg-white">
          <div className="font-heading">Skybox preview</div>
          <div className="text-xs text-neutral-600 mt-1">
            {resolved ? (
              <>
                Key: <span className="font-bold text-black">{resolved.key}</span> · v{resolved.version}
              </>
            ) : (
              'Resolving active version…'
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 p-4 overflow-auto scrollbar">
          {error ? (
            <div className="p-3 bg-red-100 border-2 border-border text-red-800 rounded-base text-sm">
              <strong>Error:</strong> {error}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-3">
            {FACE_SLOTS.map((slot) => {
              const f = resolved?.files?.[slot];
              return (
                <div key={slot} className="border-2 border-border rounded-base bg-white overflow-hidden">
                  <div className="px-2 py-1 text-xs font-bold border-b border-border">{slot.toUpperCase()}</div>
                  <div className="aspect-square bg-neutral-100">
                    {f?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={slot} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-neutral-600">Missing</div>
                    )}
                  </div>
                  <div className="px-2 py-1 text-[11px] text-neutral-600 border-t border-border truncate">
                    {f?.fileName ?? ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
