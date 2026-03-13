import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SceneEditorState } from './types';
import { createCoreSlice } from './slices/coreSlice';
import { createLayoutSlice } from './slices/layoutSlice';
import { createHistorySlice } from './slices/historySlice';
import { createSceneGraphSlice } from './slices/sceneGraphSlice';
import { createInputSlice } from './slices/inputSlice';
import { createLogSlice } from './slices/logSlice';
import { createPrefabSlice } from './slices/prefabSlice';
import { createPluginSlice } from './slices/pluginSlice';

export const useEditorStore = create<SceneEditorState>()(
    subscribeWithSelector((...a) => ({
        ...createCoreSlice(...a),
        ...createHistorySlice(...a),
        ...createSceneGraphSlice(...a),
        ...createLayoutSlice(...a),
        ...createInputSlice(...a),
        ...createLogSlice(...a),
        ...createPrefabSlice(...a),
        ...createPluginSlice(...a),
    }))
);

// We still export all types so consumer code can easily reference them through `store/`
export * from './types';
