import type { Entity } from '@duckengine/ecs';

export type EditorMode = 'edit' | 'play';

export type EditorResource = {
  id: string;
  key: string;
  kind: 'scene' | 'prefab' | (string & {});
  displayName: string;
  activeVersion: number | null;
};

export type CreatableComponentDef = { type: string; label: string };

export type EcsComponentFactoryLike = {
  listCreatableComponents: (entity: Entity) => CreatableComponentDef[];
};

export type EcsTreeEditorStore = {
  containerRef: React.RefObject<HTMLDivElement>;

  error: string | null;
  setError: (v: string | null) => void;

  mode: EditorMode;
  paused: boolean;

  debugTransformsEnabled: boolean;
  setDebugTransformsEnabled: (v: boolean) => void;

  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;

  onPlay: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => Promise<void>;

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedEntity?: Entity;

  hierarchyRoots: Entity[];
  allEntitiesForHierarchy: Entity[];

  onCreateEmpty: () => void;
  onDeleteSelected: () => void;
  onReparent: (newParentId: string | null) => void;
  onAddComponent: (type: string) => void;
  onRemoveComponent: (type: string) => void;

  onSetSelectedName: (value: string) => void;
  onSetSelectedLocalPositionAxis: (axis: 'x' | 'y' | 'z', n: number) => void;
  onUpdateSelectedComponentData: (type: string, data: Record<string, unknown>) => void;

  commitFromCurrentEditScene: (reason: string) => void;

  factory: EcsComponentFactoryLike;
};
