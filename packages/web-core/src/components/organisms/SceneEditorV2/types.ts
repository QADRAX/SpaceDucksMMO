import type * as React from 'react';
import type { Entity } from '@duckengine/ecs';

// ─── Editor Resource ───────────────────────────────────────────────────────

export type EditorResource = {
    id: string;
    key: string;
    kind: 'scene' | 'prefab' | (string & {});
    displayName: string;
    activeVersion: number | null;
};

// ─── Game State Machine ────────────────────────────────────────────────────

/** The execution state of the game scripts. The editor is always "on". */
export type GameState = 'stopped' | 'playing' | 'paused';

// ─── Panel System ──────────────────────────────────────────────────────────

/**
 * Panel identifiers — the known panels in the editor layout.
 * Custom plugin panels are tracked separately.
 */
export type PanelId =
    | 'hierarchy'
    | 'viewport:main'
    | 'inspector'
    | 'console'
    | 'scriptBrowser';

export type ViewportDef = {
    viewId: string;
    cameraEntityId?: string;
};


// ─── Scene Node Reserved ID ────────────────────────────────────────────────

/** Synthetic ID used to represent the scene root in the hierarchy tree. */
export const SCENE_NODE_ID = '__scene__';

// ─── Creatable Component ───────────────────────────────────────────────────

export type CreatableComponentDef = {
    type: string;
    label: string;
    category: string;
    icon: string;
};

export type EcsComponentFactoryLike = {
    listCreatableComponents: (entity: Entity) => CreatableComponentDef[];
};

// ─── Editor Store ──────────────────────────────────────────────────────────

/**
 * The full public surface of the SceneEditorV2 store.
 * Provided via context and returned by useSceneEditorV2.
 */
export type SceneEditorV2Store = {
    // ── Resource metadata ─────────────────────────────────────────────────
    sceneId: string;
    resourceDisplayName: string;
    onSetResourceDisplayName: (v: string) => void;
    onSaveResourceDisplayName: (v: string) => Promise<void>;

    // ── Error ─────────────────────────────────────────────────────────────
    error: string | null;
    setError: (v: string | null) => void;

    // ── Game state ────────────────────────────────────────────────────────
    gameState: GameState;
    onPlay: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;

    // ── Persistence & History ─────────────────────────────────────────────
    dirty: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => Promise<void>;

    /** Bumped on changes that don't touch the snapshot (debug flags, etc.) */
    presentationRevision: number;
    /** Bumped when the scene is rebuilt (first load, undo, stop). */
    sceneRevision: number;

    // ── Selection ─────────────────────────────────────────────────────────
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    selectedEntity?: Entity;

    // ── Hierarchy ─────────────────────────────────────────────────────────
    hierarchyRoots: Entity[];
    allEntities: Entity[];

    // ── Layout & Viewports ────────────────────────────────────────────────
    layout: {
        viewports: ReadonlyArray<ViewportDef>;
        registerViewport: (def: ViewportDef) => void;
        unregisterViewport: (id: string) => void;
    };
    registerViewport: (def: ViewportDef) => void;
    unregisterViewport: (id: string) => void;
    activeCameraEntityId: string | null;
    onSetActiveCameraEntityId: (id: string | null) => void;

    // ── Entity meta ───────────────────────────────────────────────────────
    onSetSelectedName: (v: string) => void;
    onSetSelectedGizmoIcon: (v: string) => void;
    onSetSelectedLocalPositionAxis: (axis: 'x' | 'y' | 'z', n: number) => void;

    // ── Entity actions (now grouped) ──────────────────────────────────────
    actions: Record<string, any>;
    onReparentEntity: (childId: string, newParentId: string | null) => void;
    onCreateEmpty: () => void;
    onDeleteSelected: () => void;
    onDuplicateSelected: () => void;
    onAddComponent: (type: string) => void;
    onRemoveComponent: (type: string) => void;
    onUpdateSelectedComponentData: (
        type: string,
        data: Record<string, unknown> & { live?: boolean }
    ) => void;

    // ── Engines & Factories ───────────────────────────────────────────────
    sceneRef: { current: any };
    engineRef: { current: any };
    engine?: any;
    factory: any;
    inputRef: { current: any };
    input?: any;

    /** Action trigger — called when UI components or plugins commit changes */
    commitFromCurrentScene: (reason?: string) => void;
};
