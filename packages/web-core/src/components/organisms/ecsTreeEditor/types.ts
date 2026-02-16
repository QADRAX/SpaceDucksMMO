import type { Entity } from '@duckengine/ecs';

// Reserved selection id for the synthetic scene root node in the hierarchy tree.
// Entity ids are GUID/random, so this should never collide in practice.
export const SCENE_NODE_ID = '__scene__';

export type EditorMode = 'edit' | 'play';

export type EditorResource = {
  id: string;
  key: string;
  kind: 'scene' | 'prefab' | (string & {});
  displayName: string;
  activeVersion: number | null;
};

export type CreatableComponentDef = { type: string; label: string; category: string; icon: string };

export type EcsComponentFactoryLike = {
  listCreatableComponents: (entity: Entity) => CreatableComponentDef[];
};

export type EcsTreeEditorStore = {
  containerRef: React.RefObject<HTMLDivElement>;

  error: string | null;
  setError: (v: string | null) => void;

  mode: EditorMode;
  paused: boolean;

  /** Bumped on non-snapshot UI changes (e.g., per-entity debug flags). */
  presentationRevision: number;

  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;

  onPlay: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => Promise<void>;

  resourceDisplayName: string;
  onSetResourceDisplayName: (value: string) => void;
  onSaveResourceDisplayName: (value: string) => Promise<void>;

  /** Active camera entity id for the scene (must be a user entity with camera component). */
  activeCameraEntityId: string | null;
  onSetActiveCameraEntityId: (id: string | null) => void;

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedEntity?: Entity;

  hierarchyRoots: Entity[];
  allEntitiesForHierarchy: Entity[];

  /** Forces panel refreshes when scenes are rebuilt into refs (first load). */
  sceneRevision: number;

  onCreateEmpty: () => void;
  onDeleteSelected: () => void;
  onReparent: (newParentId: string | null) => void;
  onReparentEntity: (childId: string, newParentId: string | null) => void;
  onAddComponent: (type: string) => void;
  onRemoveComponent: (type: string) => void;

  onSetSelectedName: (value: string) => void;
  onSetSelectedGizmoIcon: (value: string) => void;
  onSetSelectedLocalPositionAxis: (axis: 'x' | 'y' | 'z', n: number) => void;
  onUpdateSelectedComponentData: (type: string, data: Record<string, unknown>) => void;

  /** Toggle per-entity debug visualizations for the given entity id. */
  onToggleEntityDebugTransform: (id: string) => void;
  onToggleEntityDebugMesh: (id: string) => void;
  onToggleEntityDebugCollider: (id: string) => void;

  /** Clear all entity debug flags in the current edit scene. */
  onClearAllDebug: () => void;

  commitFromCurrentEditScene: (reason: string) => void;

  factory: EcsComponentFactoryLike;
};
