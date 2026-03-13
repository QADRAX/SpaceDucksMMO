import type { StateCreator } from 'zustand';
import { collectAllFromRoots } from '../../logic/liveSceneRuntime';
import type { EditorCoreSlice, SceneEditorState, GameState } from '../types';

export const createCoreSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorCoreSlice
> = (set, get) => ({
    scene: null,
    engine: null,
    sceneRef: { current: null },
    engineRef: { current: null },
    historyRef: { current: null },

    // PRIMITIVE STATE
    sceneId: '',
    resourceDisplayName: '',
    error: null,
    gameState: 'stopped',
    sceneRevision: 0,
    presentationRevision: 0,

    // ACTIONS
    initialize: (scene, engine) => {
        set({
            scene,
            engine,
            gameState: 'stopped',
            error: null,
            selectedId: null,
            historyCursor: -1,
            historyStackCount: 0,
            dirty: false,
        });
        get().sceneRef.current = scene;
        get().engineRef.current = engine;
    },

    setGameState: (state: GameState) => {
        set({ gameState: state });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    setResourceDisplayName: (name: string) => {
        set({ resourceDisplayName: name });
    },

    incrementSceneRevision: () => {
        set((state: SceneEditorState) => ({ sceneRevision: state.sceneRevision + 1 }));
    },

    incrementPresentationRevision: () => {
        set((state: SceneEditorState) => ({ presentationRevision: state.presentationRevision + 1 }));
    },

    bumpRevision: () => {
        set((state: SceneEditorState) => ({ sceneRevision: state.sceneRevision + 1 }));
    },

    syncHierarchy: () => {
        const scene = get().scene;
        if (!scene) return;

        // We trigger a bumpRevision to let the UI know things moved
        get().bumpRevision();
    },
});
