import type { StateCreator } from 'zustand';
import type { EditorHistorySlice, SceneEditorState } from '../types';

export const createHistorySlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorHistorySlice
> = (set, get) => ({
    // STATE
    dirty: false,
    historyStackCount: 0,
    historyCursor: -1,

    // ACTIONS
    setDirty: (dirty) => set({ dirty }),

    commitFromCurrentScene: (reason?: string) => {
        const { sceneRef, historyRef, incrementSceneRevision } = get();
        if (!sceneRef.current || !historyRef.current) return;

        historyRef.current.takeSnapshot(sceneRef.current);
        const nextState = historyRef.current.getState();

        set({
            historyStackCount: nextState.stackCount,
            historyCursor: nextState.cursor,
            dirty: true,
        });

        // Whenever we commit to history, we increment revision
        // so that the UI understands there's a new state to derive from
        incrementSceneRevision();

        if (reason) {
            console.debug(`[EditorHistory] commit: ${reason}`);
        }
    },

    undo: () => {
        const { sceneRef, historyRef, gameState, incrementSceneRevision } = get();
        if (gameState !== 'stopped') return;
        if (!sceneRef.current || !historyRef.current) return;

        if (historyRef.current.undo(sceneRef.current)) {
            const nextState = historyRef.current.getState();
            set({
                historyStackCount: nextState.stackCount,
                historyCursor: nextState.cursor,
                dirty: true,
                selectedId: null, // Clear selection on undo matching legacy behavior
            });
            incrementSceneRevision();
        }
    },

    redo: () => {
        const { sceneRef, historyRef, gameState, incrementSceneRevision } = get();
        if (gameState !== 'stopped') return;
        if (!sceneRef.current || !historyRef.current) return;

        if (historyRef.current.redo(sceneRef.current)) {
            const nextState = historyRef.current.getState();
            set({
                historyStackCount: nextState.stackCount,
                historyCursor: nextState.cursor,
                dirty: true,
                selectedId: null, // Clear selection on redo matching legacy behavior
            });
            incrementSceneRevision();
        }
    },
});
