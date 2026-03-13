import type { StateCreator } from 'zustand';
import type { EditorPrefabSlice, SceneEditorState } from '../types';

export const createPrefabSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorPrefabSlice
> = (set, get) => ({
    draggedPrefabId: null,

    setDraggedPrefabId: (id) => set({ draggedPrefabId: id }),

    onDropPrefab: (screenX, screenY) => {
        // Implementation will reside in a specialized hook or raycaster component
        // that reads the draggedPrefabId, raycasts against the ViewportCanvas,
        // instantiates the ECS entity, calls addEntity, and optionally commits history.
        // For now, it's an action slot.
        const { draggedPrefabId, logWarn } = get();
        if (!draggedPrefabId) return;

        logWarn('Editor', `onDropPrefab stub triggered for ${draggedPrefabId} at screen coords ${screenX}, ${screenY}`);
    }
});
