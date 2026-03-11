import type { SceneState, SceneView } from './types';

/**
 * Creates a readonly snapshot of the scene state.
 * Consistent with createEntityView, this provides a stable view of the scene
 * suitable for APIs and UI consumers.
 */
export function createSceneView(scene: SceneState): SceneView {
    return {
        id: scene.id,
        paused: scene.paused,
        activeCameraId: scene.activeCameraId,
        rootEntityIds: [...scene.rootEntityIds],
        debugFlags: new Map(scene.debugFlags),
        prefabs: new Map(scene.prefabs),
        uiSlots: new Map(scene.uiSlots),
    };
}
