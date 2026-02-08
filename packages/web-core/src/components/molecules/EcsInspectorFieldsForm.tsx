'use client';

import * as React from 'react';

import type { InspectorFieldConfig } from '@duckengine/ecs';

import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';

export type EcsInspectorValue = Record<string, unknown>;

function coerceBoolean(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export function EcsInspectorFieldsForm({
  fields,
  value,
  onChange,
  hideTypes,
}: {
  fields: InspectorFieldConfig<any, unknown>[];
  value: EcsInspectorValue;
  onChange: (next: EcsInspectorValue) => void;
  hideTypes?: Array<InspectorFieldConfig['type']>;
}) {
  const hidden = new Set(hideTypes ?? []);

  return (
    <div className="space-y-4">
      {fields
        .filter((f) => !hidden.has(f.type))
        .map((f) => {
          const key = f.key;
          const label = f.label ?? key;
          const type = f.type ?? 'string';
          const current = (value as any)[key];

          const set = (nextValue: unknown) => {
            onChange({ ...value, [key]: nextValue });
          };

          if (type === 'boolean') {
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <Label>{label}</Label>
                  {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
                </div>
                <input
                  type="checkbox"
                  checked={coerceBoolean(current)}
                  onChange={(e) => set(e.target.checked)}
                />
              </div>
            );
          }

          if (type === 'number') {
            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={current === undefined || current === null ? '' : String(current)}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw.length) {
                      set(undefined);
                      return;
                    }
                    const n = Number(raw);
                    set(Number.isFinite(n) ? n : undefined);
                  }}
                />
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'color') {
            // Accept both numeric and hex string. We'll store as string.
            const asString = typeof current === 'string' ? current : '';
            const safeHex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(asString) ? asString : '#ffffff';

            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={safeHex.slice(0, 7)}
                    onChange={(e) => set(e.target.value)}
                  />
                  <Input value={asString} onChange={(e) => set(e.target.value)} placeholder="#ffffff" />
                </div>
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'texture') {
            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={typeof current === 'string' ? current : ''}
                  onChange={(e) => set(e.target.value)}
                  placeholder="catalog id or URL"
                />
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          // default string
          return (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input value={typeof current === 'string' ? current : ''} onChange={(e) => set(e.target.value)} />
              {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
            </div>
          );
        })}
    </div>
  );
}
