import type { StateCreator } from 'zustand';
import type { EditorInputSlice, SceneEditorState } from '../types';

export const createInputSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorInputSlice
> = (set, get) => ({
    isPointerLocked: false,
    keysDown: {},

    setPointerLocked: (locked) => {
        set({ isPointerLocked: locked });
    },

    setKeyDown: (key, isDown) => {
        set((state) => ({
            keysDown: { ...state.keysDown, [key]: isDown },
        }));
    },

    isKeyDown: (key) => {
        return !!get().keysDown[key];
    },
});
