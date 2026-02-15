'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import type { Entity } from '@duckengine/ecs';

export function HierarchyPanel() {
  const editor = useEcsTreeEditorContext();

  return (
    <div className="col-span-3 flex min-h-105 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <div className="flex items-center justify-between border-b border-border p-2">
        <div className="text-sm font-bold">Hierarchy</div>
        <div className="flex items-center gap-2">
          <Button onClick={editor.onCreateEmpty} disabled={editor.mode !== 'edit'} variant="secondary" size="sm">
            +
          </Button>
          <Button
            onClick={editor.onDeleteSelected}
            disabled={editor.mode !== 'edit' || !editor.selectedId}
            variant="secondary"
            size="sm"
          >
            -
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {editor.hierarchyRoots.length === 0 ? (
          <div className="text-sm text-neutral-600">Empty.</div>
        ) : (
          <div className="space-y-1">
            {editor.hierarchyRoots.map((r) => (
              <HierarchyNode
                key={r.id}
                entity={r}
                depth={0}
                selectedId={editor.selectedId}
                onSelect={(id) => editor.setSelectedId(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HierarchyNode({
  entity,
  depth,
  selectedId,
  onSelect,
}: {
  entity: Entity;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const name = React.useMemo(() => {
    const c = entity.getComponent('name') as any;
    const v = typeof c?.value === 'string' ? c.value : '';
    return v || entity.id;
  }, [entity]);

  const isSelected = selectedId === entity.id;

  return (
    <div>
      <button
        type="button"
        className={
          'w-full text-left rounded-base border px-2 py-1 text-sm ' +
          (isSelected ? 'bg-neutral-100 border-border font-bold' : 'bg-white border-transparent hover:border-border')
        }
        style={{ marginLeft: depth * 10 }}
        onClick={() => onSelect(entity.id)}
      >
        {name}
      </button>

      {entity.getChildren().length ? (
        <div className="mt-1 space-y-1">
          {entity.getChildren().map((c) => (
            <HierarchyNode
              key={c.id}
              entity={c}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
