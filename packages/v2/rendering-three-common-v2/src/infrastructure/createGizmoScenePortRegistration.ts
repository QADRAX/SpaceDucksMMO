import type { GizmoPort, SceneState } from '@duckengine/core-v2';
import { GizmoPortDef } from '@duckengine/core-v2';
import type { PerSceneState } from '../domain/renderContextThree';
import { createGizmoDrawer } from '../domain/createGizmoDrawer';

/**
 * Creates the onSceneStateCreated callback that registers GizmoPort on scene.scenePorts.
 * Same pattern as physics: when rendering creates per-scene state, it registers the port
 * directly on the scene's port registry. Scripting resolves ports.gizmo from the merged
 * registry (scene + engine); the scene's gizmo takes precedence.
 *
 * Returns { onSceneStateCreated, clearAll } for use in createRenderingState.
 */
export function createGizmoScenePortRegistration() {
  const drawerCache = new Map<string, GizmoPort>();

  const onSceneStateCreated = (scene: SceneState, state: PerSceneState): void => {
    const drawer = createGizmoDrawer(state.threeScene, state.context.three);
    (scene.scenePorts as Map<string, unknown>).set(GizmoPortDef.id, drawer);
    (scene.scenePortDefinitions as Map<string, unknown>).set(GizmoPortDef.id, GizmoPortDef);
    drawerCache.set(scene.id, drawer);
  };

  const clearAll = (): void => {
    for (const drawer of drawerCache.values()) drawer.clear();
  };

  return { onSceneStateCreated, clearAll };
}
