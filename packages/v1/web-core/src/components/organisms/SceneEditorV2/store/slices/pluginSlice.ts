import type { StateCreator } from 'zustand';
import type { EditorPluginSlice, SceneEditorState } from '../types';

export const createPluginSlice: StateCreator<
    SceneEditorState,
    [],
    [],
    EditorPluginSlice
> = (set, get) => ({
    pluginsEnabled: {}, // Stores toggles: Record<pluginId, boolean>

    setPluginEnabled: (pluginId, enabled) => {
        set((state) => ({
            pluginsEnabled: {
                ...state.pluginsEnabled,
                [pluginId]: enabled
            }
        }));
    },

    isPluginEnabled: (pluginId) => {
        return !!get().pluginsEnabled[pluginId];
    }
});
