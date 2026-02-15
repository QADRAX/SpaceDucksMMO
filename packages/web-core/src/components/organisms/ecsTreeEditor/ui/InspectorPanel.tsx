'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Select } from '@/components/atoms/Select';

import { EcsInspectorFieldsForm } from '@/components/molecules/EcsInspectorFieldsForm';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import { ReparentInput } from './ReparentInput';

export function InspectorPanel() {
  const editor = useEcsTreeEditorContext();
  const selected = editor.selectedEntity;

  const selectedNameValue = React.useMemo(() => {
    if (!selected) return '';
    const c = selected.getComponent('name') as any;
    return typeof c?.value === 'string' ? c.value : '';
  }, [selected]);

  const selectedComponents = React.useMemo(() => {
    if (!selected) return [];
    return selected.getAllComponents();
  }, [selected]);

  const creatableComponents = React.useMemo(() => {
    if (!selected) return [];
    return editor.factory.listCreatableComponents(selected as any);
  }, [editor.factory, selected]);

  return (
    <div className="col-span-3 flex min-h-105 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <div className="border-b border-border p-2">
        <div className="text-sm font-bold">Inspector</div>
        <div className="text-xs text-muted-foreground">{selected ? selected.id : 'No selection'}</div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {selected ? (
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={selectedNameValue}
                onChange={(e) => editor.onSetSelectedName(e.target.value)}
                disabled={editor.mode !== 'edit'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-muted-foreground">Reparent</div>
              <ReparentInput disabled={editor.mode !== 'edit'} onReparent={(idOrNull) => editor.onReparent(idOrNull)} />
            </div>

            <div className="space-y-2">
              <div className="font-bold">Transform</div>
              <div className="grid grid-cols-3 gap-2">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <label key={axis} className="flex flex-col gap-1 text-sm">
                    <span className="text-neutral-600">Pos {axis.toUpperCase()}</span>
                    <input
                      className="border border-border rounded-base px-2 py-1"
                      type="number"
                      step={0.1}
                      defaultValue={(selected.transform.localPosition as any)[axis]}
                      onBlur={(e) => editor.onSetSelectedLocalPositionAxis(axis, Number(e.currentTarget.value))}
                      disabled={editor.mode !== 'edit'}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">Components</div>
                <Select
                  defaultValue=""
                  onChange={(e) => {
                    const t = e.target.value;
                    if (!t) return;
                    editor.onAddComponent(t);
                    e.currentTarget.value = '';
                  }}
                  disabled={editor.mode !== 'edit'}
                >
                  <option value="">Add…</option>
                  {creatableComponents.map((d) => (
                    <option key={d.type} value={d.type}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-3">
                {selectedComponents.length === 0 ? (
                  <div className="text-sm text-neutral-600">No components.</div>
                ) : (
                  selectedComponents.map((c: any) => {
                    const fields = (c.metadata?.inspector?.fields ?? []) as any[];
                    const value: Record<string, unknown> = {};
                    for (const f of fields) value[f.key] = c[f.key];

                    return (
                      <div key={c.type} className="border border-border rounded-base p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-sm">{c.type}</div>
                          {c.type !== 'name' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => editor.onRemoveComponent(c.type)}
                              disabled={editor.mode !== 'edit'}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>

                        {fields.length ? (
                          <div className="mt-3">
                            <EcsInspectorFieldsForm
                              fields={fields as any}
                              value={value}
                              onChange={(next) => editor.onUpdateSelectedComponentData(c.type, next)}
                              hideTypes={['reference', 'enum'] as any}
                            />
                          </div>
                        ) : (
                          <div className="mt-3 text-sm text-neutral-600">No editable fields.</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select an entity to edit.</div>
        )}
      </div>
    </div>
  );
}
