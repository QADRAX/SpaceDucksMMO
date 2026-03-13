import type { StateCreator } from 'zustand';
import type { EditorLayoutSlice, SceneEditorState } from '../types';

export const createLayoutSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorLayoutSlice
> = (set) => ({
    activeCameraEntityId: null,
    viewports: [],

    setActiveCameraEntityId: (id) => set({ activeCameraEntityId: id }),

    registerViewport: (id) =>
        set((state) => {
            if (state.viewports.includes(id)) return state;
            return { viewports: [...state.viewports, id] };
        }),

    unregisterViewport: (id) =>
        set((state) => ({
            viewports: state.viewports.filter((v) => v !== id),
        })),
});
