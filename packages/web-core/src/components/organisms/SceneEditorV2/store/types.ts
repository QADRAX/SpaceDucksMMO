import * as React from 'react';
import type { EditorSceneHistory } from '../logic/EditorSceneHistory';
import type { EcsLiveScene } from '../logic/EcsLiveScene';

// ============================================================================
// STATE ENUMS & TYPES
// ============================================================================
export type GameState = 'playing' | 'paused' | 'stopped';

export interface EditorLogEntry {
    id: string;
    timestamp: number;
    severity: 'info' | 'warn' | 'error';
    system: string;
    message: string;
    data?: any;
}

// ============================================================================
// CORE SLICE
// ============================================================================
export interface EditorCoreSlice {
    scene: EcsLiveScene | null;
    engine: any | null;
    sceneRef: React.MutableRefObject<EcsLiveScene | null>;
    engineRef: React.MutableRefObject<any | null>;
    historyRef: React.MutableRefObject<EditorSceneHistory | null>;

    sceneId: string;
    resourceDisplayName: string;
    error: string | null;
    gameState: GameState;
    sceneRevision: number;
    presentationRevision: number;

    initialize: (
        scene: EcsLiveScene,
        engine: any
    ) => void;
    setGameState: (state: GameState) => void;
    setError: (error: string | null) => void;
    setResourceDisplayName: (name: string) => void;
    bumpRevision: () => void;
    syncHierarchy: () => void;
    incrementSceneRevision: () => void;
    incrementPresentationRevision: () => void;
}

// ============================================================================
// HISTORY SLICE
// ============================================================================
export interface EditorHistorySlice {
    dirty: boolean;
    historyStackCount: number;
    historyCursor: number;

    commitFromCurrentScene: (reason?: string) => void;
    undo: () => void;
    redo: () => void;
    setDirty: (dirty: boolean) => void;
}

// ============================================================================
// SCENE GRAPH SLICE (ECS & Selection)
// ============================================================================
export interface EditorSceneGraphSlice {
    selectedId: string | null;

    setSelectedId: (id: string | null) => void;

    onCreateEmpty: () => void;
    onDeleteSelected: () => void;
    onDuplicateSelected: () => void;
    onReparentEntity: (childId: string, newParentId: string | null) => void;

    onSetSelectedName: (name: string) => void;
    onSetSelectedGizmoIcon: (icon: string) => void;
    onSetSelectedLocalPositionAxis: (axis: 'x' | 'y' | 'z', val: number) => void;

    onAddComponent: (type: string) => void;
    onRemoveComponent: (type: string) => void;
    onUpdateSelectedComponentData: (
        type: string,
        data: Record<string, unknown> & { live?: boolean }
    ) => void;
}

// ============================================================================
// LAYOUT SLICE
// ============================================================================
export interface EditorLayoutSlice {
    activeCameraEntityId: string | null;
    viewports: string[];

    setActiveCameraEntityId: (id: string | null) => void;
    registerViewport: (id: string) => void;
    unregisterViewport: (id: string) => void;
}

// ============================================================================
// LOGS SLICE
// ============================================================================
export interface EditorLogSlice {
    logs: EditorLogEntry[];
    maxLogs: number;

    logInfo: (system: string, message: string, data?: any) => void;
    logWarn: (system: string, message: string, data?: any) => void;
    logError: (system: string, message: string, data?: any) => void;
    clearLogs: () => void;
}

// ============================================================================
// INPUT & INTERACTION SLICE
// ============================================================================
export interface EditorInputSlice {
    isPointerLocked: boolean;
    keysDown: Record<string, boolean>;

    setPointerLocked: (locked: boolean) => void;
    setKeyDown: (key: string, isDown: boolean) => void;
    isKeyDown: (key: string) => boolean;
}

// ============================================================================
// PREFAB SLICE
// ============================================================================
export interface EditorPrefabSlice {
    draggedPrefabId: string | null;

    setDraggedPrefabId: (id: string | null) => void;
    onDropPrefab: (screenX: number, screenY: number) => void; // Implemented later with Raycaster
}

// ============================================================================
// PLUGIN SLICE
// ============================================================================
export interface EditorPluginSlice {
    pluginsEnabled: Record<string, boolean>;

    setPluginEnabled: (pluginId: string, enabled: boolean) => void;
    isPluginEnabled: (pluginId: string) => boolean;
}

// ============================================================================
// ROOT STATE COMBINED
// ============================================================================
export type SceneEditorState =
    EditorCoreSlice &
    EditorHistorySlice &
    EditorSceneGraphSlice &
    EditorLayoutSlice &
    EditorLogSlice &
    EditorInputSlice &
    EditorPrefabSlice &
    EditorPluginSlice;
