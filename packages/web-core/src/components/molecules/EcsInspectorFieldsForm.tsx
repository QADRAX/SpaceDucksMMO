'use client';

import * as React from 'react';

import type { InspectorFieldConfig } from '@duckengine/ecs';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';
import { NumberPushInput } from '@/components/molecules/NumberPushInput';
import { EntityReferenceDropdown, type EntityReferenceOption } from '@/components/molecules/EntityReferenceDropdown';

import {
  getRememberedStep,
  setRememberedStep
} from '../organisms/SceneEditor/ui/inspectorUiMemory';

export type EcsInspectorValue = Record<string, unknown>;

export type TextureFileState = {
  file: File;
  blobUrl: string;
};

function safeNumber(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function coerceBoolean(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function isNullableField(f: InspectorFieldConfig<any, unknown>): boolean {
  return !!(f as any)?.nullable;
}

export function EcsInspectorFieldsForm({
  fields,
  value,
  selectionKey,
  onChange,
  onCommit,
  hideTypes,
  disabled,
  referenceOptions,
  textureFilesByKey,
  onPickTextureFile,
}: {
  fields: InspectorFieldConfig<any, unknown>[];
  value: EcsInspectorValue;
  selectionKey?: string;
  onChange: (next: EcsInspectorValue) => void;
  onCommit?: () => void;
  hideTypes?: Array<InspectorFieldConfig['type']>;
  disabled?: boolean;
  referenceOptions?: EntityReferenceOption[];
  textureFilesByKey?: Record<string, TextureFileState>;
  onPickTextureFile?: (fieldKey: string, file: File | null) => void;
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
          const nullable = isNullableField(f as any);

          const set = (nextValue: unknown) => {
            const next = { ...value } as any;
            if (nextValue === undefined) delete next[key];
            else next[key] = nextValue;
            onChange(next);
          };

          if (type === 'boolean') {
            if (nullable) {
              const raw = current;
              const selectValue = raw === null || raw === undefined ? '' : coerceBoolean(raw) ? 'true' : 'false';

              return (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Select
                    value={selectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) set(undefined);
                      else set(v === 'true');
                    }}
                    disabled={!!disabled}
                  >
                    <option value="">None</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </Select>
                  {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
                </div>
              );
            }

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
                  disabled={!!disabled}
                />
              </div>
            );
          }

          if (type === 'number') {
            const defaultStep = typeof f.step === 'number' && Number.isFinite(f.step) ? f.step : 0.1;
            const rememberedStep = selectionKey ? getRememberedStep(selectionKey, key) : undefined;
            const activeStep = rememberedStep ?? defaultStep;

            const isNullable = !!f.nullable;
            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <NumberPushInput
                  label=""
                  value={
                    typeof current === 'number' && Number.isFinite(current)
                      ? current
                      : isNullable
                        ? undefined
                        : 0
                  }
                  step={activeStep}
                  min={f.min}
                  max={f.max}
                  unit={f.unit}
                  disabled={!!disabled}
                  onChange={(n) => {
                    set(Number.isFinite(n) ? n : undefined);
                  }}
                  onClear={isNullable ? () => set(undefined) : undefined}
                  onCommit={() => {
                    onCommit?.();
                  }}
                  onStepChange={(nextStep) => {
                    if (selectionKey) setRememberedStep(selectionKey, key, nextStep);
                  }}
                />
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'reference') {
            const asId = typeof current === 'string' ? current.trim() : '';
            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                {referenceOptions && referenceOptions.length ? (
                  <EntityReferenceDropdown
                    value={asId ? asId : null}
                    options={referenceOptions}
                    disabled={!!disabled}
                    placeholder="Select entity…"
                    onChange={(next) => {
                      if (next === null) {
                        set(nullable ? undefined : '');
                        return;
                      }
                      set(next);
                    }}
                  />
                ) : (
                  <Input
                    value={asId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (nullable && !v.trim()) set(undefined);
                      else set(v);
                    }}
                    placeholder="Entity id"
                    disabled={!!disabled}
                  />
                )}
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'enum') {
            const options = Array.isArray((f as any).options) ? ((f as any).options as any[]) : [];
            const raw = current;
            const asString = raw === null || raw === undefined ? '' : String(raw);
            const hasMatch = options.some((o) => String(o?.value) === asString);
            const selectValue = nullable
              ? (hasMatch ? asString : '')
              : (hasMatch ? asString : (options.length ? String(options[0].value) : asString));

            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Select
                  value={selectValue}
                  onChange={(e) => {
                    const selected = e.target.value;
                    // Keep the raw option value type when possible.
                    if (nullable && selected === '') {
                      set(undefined);
                      return;
                    }
                    const match = options.find((o) => String(o?.value) === selected);
                    set(match ? match.value : selected);
                  }}
                  disabled={!!disabled}
                >
                  {nullable ? <option value="">None</option> : null}
                  {options.map((o) => (
                    <option key={String(o.value)} value={String(o.value)}>
                      {String(o.label ?? o.value)}
                    </option>
                  ))}
                </Select>
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'vector') {
            const defaultStep = typeof f.step === 'number' && Number.isFinite(f.step) ? f.step : 0.1;
            const isUnset = current === null || current === undefined;

            const tuple: [number | undefined, number | undefined, number | undefined] = (() => {
              if (nullable && isUnset) return [undefined, undefined, undefined];
              if (Array.isArray(current) && current.length === 3) {
                return [safeNumber(current[0], 0), safeNumber(current[1], 0), safeNumber(current[2], 0)];
              }
              if (current && typeof current === 'object') {
                const obj = current as any;
                return [safeNumber(obj.x, 0), safeNumber(obj.y, 0), safeNumber(obj.z, 0)];
              }
              return [0, 0, 0];
            })();

            const setAxis = (idx: 0 | 1 | 2, n: number) => {
              const base: [number, number, number] = [
                typeof tuple[0] === 'number' && Number.isFinite(tuple[0]) ? tuple[0] : 0,
                typeof tuple[1] === 'number' && Number.isFinite(tuple[1]) ? tuple[1] : 0,
                typeof tuple[2] === 'number' && Number.isFinite(tuple[2]) ? tuple[2] : 0,
              ];
              base[idx] = Number.isFinite(n) ? n : 0;
              set(base);
            };

            const labels = ['X', 'Y', 'Z'];

            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>

                <div className="space-y-2">
                  {[0, 1, 2].map((idx) => {
                    const subKey = `${key}_${idx}`;
                    const rememberedStep = selectionKey ? getRememberedStep(selectionKey, subKey) : undefined;
                    const activeStep = rememberedStep ?? defaultStep;

                    return (
                      <NumberPushInput
                        key={idx}
                        label={labels[idx]}
                        value={tuple[idx] as any}
                        step={activeStep}
                        min={f.min}
                        max={f.max}
                        unit={f.unit}
                        disabled={!!disabled}
                        onChange={(n) => setAxis(idx as any, n)}
                        onClear={nullable ? () => set(undefined) : undefined}
                        onCommit={() => {
                          onCommit?.();
                        }}
                        onStepChange={(nextStep) => {
                          if (selectionKey) setRememberedStep(selectionKey, subKey, nextStep);
                        }}
                      />
                    );
                  })}
                </div>

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
                    disabled={!!disabled}
                  />
                  <Input
                    value={asString}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (nullable && !v.trim()) set(undefined);
                      else set(v);
                    }}
                    placeholder="#ffffff"
                    disabled={!!disabled}
                  />
                </div>
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          if (type === 'texture') {
            const asString = typeof current === 'string' ? current : '';
            const selected = textureFilesByKey ? textureFilesByKey[key] : undefined;
            const canUpload = !!onPickTextureFile;

            if (canUpload) {
              return (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        onPickTextureFile(key, file);
                      }}
                      disabled={!!disabled}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onPickTextureFile(key, null)}
                      disabled={!!disabled || !selected}
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-neutral-600">
                      {selected ? `Selected: ${selected.file.name}` : 'No file selected'}
                    </div>

                    <Input
                      value={asString}
                      onChange={(e) => {
                        const v = e.target.value;
                        // Manual override: clear file selection.
                        if (selected) onPickTextureFile(key, null);
                        if (nullable && !v.trim()) set(undefined);
                        else set(v);
                      }}
                      placeholder="catalog id or URL (optional)"
                      disabled={!!disabled}
                    />
                  </div>

                  {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
                </div>
              );
            }

            return (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  value={asString}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (nullable && !v.trim()) set(undefined);
                    else set(v);
                  }}
                  placeholder="catalog id or URL"
                  disabled={!!disabled}
                />
                {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
              </div>
            );
          }

          // default string
          return (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                value={typeof current === 'string' ? current : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (nullable && !v) set(undefined);
                  else set(v);
                }}
                disabled={!!disabled}
              />
              {f.description ? <div className="text-xs text-neutral-600">{f.description}</div> : null}
            </div>
          );
        })}
    </div>
  );
}
