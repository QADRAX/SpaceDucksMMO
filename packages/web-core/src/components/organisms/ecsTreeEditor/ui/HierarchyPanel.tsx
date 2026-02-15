'use client';

import * as React from 'react';

import { Button } from '@/components/atoms/Button';

import { useEcsTreeEditorContext } from '../EcsTreeEditorContext';
import type { Entity } from '@duckengine/ecs';
import { SCENE_NODE_ID } from '../types';

export function HierarchyPanel() {
  const editor = useEcsTreeEditorContext();
  // Force re-render when the scene graph is rebuilt into refs.
  void editor.sceneRevision;

  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  // Reset hover state on scene rebuild.
  React.useEffect(() => {
    setDragOverId(null);
  }, [editor.sceneRevision]);

  const isExpanded = (id: string) => collapsed[id] !== true;
  const toggleExpanded = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: prev[id] !== true }));
  };

  const handleDropToParent = (newParentId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    setDragOverId(null);
    if (!draggedId) return;
    if (draggedId === newParentId) return;
    editor.onReparentEntity(draggedId, newParentId);
  };

  return (
    <div className="col-span-3 flex min-h-0 flex-col overflow-hidden rounded-base border-2 border-border bg-white">
      <div
        className="flex items-center justify-between border-b border-border p-2"
        onClick={() => editor.setSelectedId(null)}
      >
        <div className="text-sm font-bold">Hierarchy</div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

      <div className="scrollbar min-h-0 flex-1 overflow-y-auto p-2" onClick={() => editor.setSelectedId(null)}>
        <div className="space-y-1">
          <TreeRow
            id={SCENE_NODE_ID}
            depth={0}
            label={editor.resourceDisplayName || 'Scene'}
            selected={editor.selectedId === SCENE_NODE_ID}
            hasChildren={true}
            expanded={isExpanded(SCENE_NODE_ID)}
            onToggle={() => toggleExpanded(SCENE_NODE_ID)}
            onSelect={() => editor.setSelectedId(SCENE_NODE_ID)}
            droppable={editor.mode === 'edit'}
            dragOver={dragOverId === SCENE_NODE_ID}
            onDragOver={() => setDragOverId(SCENE_NODE_ID)}
                onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => handleDropToParent(null, e)}
          />

          {isExpanded(SCENE_NODE_ID) ? (
            editor.hierarchyRoots.length === 0 ? (
              <div className="ml-4 text-sm text-neutral-600">Empty.</div>
            ) : (
              <div className="space-y-1">
                {editor.hierarchyRoots.map((r) => (
                  <EntityNode
                    key={r.id}
                    entity={r}
                    depth={1}
                    selectedId={editor.selectedId}
                    isExpanded={isExpanded}
                    onToggle={toggleExpanded}
                    onSelect={(id) => editor.setSelectedId(id)}
                    canDragDrop={editor.mode === 'edit'}
                    dragOverId={dragOverId}
                    setDragOverId={setDragOverId}
                    onDropToParent={(parentId, e) => handleDropToParent(parentId, e)}
                  />
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EntityNode(props: {
  entity: Entity;
  depth: number;
  selectedId: string | null;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  canDragDrop: boolean;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
  onDropToParent: (parentId: string, e: React.DragEvent) => void;
}) {
  const { entity } = props;
  const displayName = (entity.displayName && entity.displayName.trim()) ? entity.displayName.trim() : '';
  const label = displayName ? displayName : entity.id;
  const labelIsId = !displayName;
  const children = entity.getChildren();
  const hasChildren = children.length > 0;
  const expanded = props.isExpanded(entity.id);
  const selected = props.selectedId === entity.id;

  return (
    <div>
      <TreeRow
        id={entity.id}
        depth={props.depth}
        label={label}
        labelIsId={labelIsId}
        selected={selected}
        hasChildren={hasChildren}
        expanded={expanded}
        onToggle={hasChildren ? () => props.onToggle(entity.id) : undefined}
        onSelect={() => props.onSelect(entity.id)}
        draggable={props.canDragDrop}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', entity.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        droppable={props.canDragDrop}
        dragOver={props.dragOverId === entity.id}
        onDragOver={() => props.setDragOverId(entity.id)}
        onDragLeave={() => props.setDragOverId(null)}
        onDrop={(e) => props.onDropToParent(entity.id, e)}
      />

      {hasChildren && expanded ? (
        <div className="mt-1 space-y-1">
          {children.map((c) => (
            <EntityNode
              key={c.id}
              entity={c}
              depth={props.depth + 1}
              selectedId={props.selectedId}
              isExpanded={props.isExpanded}
              onToggle={props.onToggle}
              onSelect={props.onSelect}
              canDragDrop={props.canDragDrop}
              dragOverId={props.dragOverId}
              setDragOverId={props.setDragOverId}
              onDropToParent={props.onDropToParent}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TreeRow(props: {
  id: string;
  depth: number;
  label: string;
  labelIsId?: boolean;
  selected: boolean;
  hasChildren: boolean;
  expanded: boolean;
  onToggle?: () => void;
  onSelect: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  droppable?: boolean;
  dragOver?: boolean;
  onDragOver?: () => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const indent = props.depth * 12;

  return (
    <div
      className={
        'flex items-center gap-1 rounded-base border px-2 py-1 text-sm ' +
        (props.selected
          ? 'bg-neutral-100 border-border'
          : props.dragOver
            ? 'bg-main border-border'
            : 'bg-white border-transparent hover:border-border')
      }
      style={{ marginLeft: indent }}
      draggable={props.draggable}
      onDragStart={props.onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect();
      }}
      onDragOver={(e) => {
        if (!props.droppable) return;
        e.preventDefault();
        props.onDragOver?.();
      }}
      onDragLeave={() => props.onDragLeave?.()}
      onDrop={(e) => props.onDrop?.(e)}
    >
      {props.hasChildren ? (
        <button
          type="button"
          className="w-6 text-xs opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            props.onToggle?.();
          }}
          aria-label={props.expanded ? 'Collapse' : 'Expand'}
        >
          <span className={props.expanded ? 'transition-transform' : '-rotate-90 transition-transform'}>▾</span>
        </button>
      ) : (
        <div className="w-6" />
      )}

      <div className={props.labelIsId ? 'flex-1 text-left font-mono text-xs font-normal opacity-80' : 'flex-1 text-left'}>
        {props.label}
      </div>
    </div>
  );
}
