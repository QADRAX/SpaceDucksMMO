import { defineSceneUseCase } from './sceneUseCase';

/** Parameters for the updateScene use case. */
export interface UpdateSceneParams {
  readonly dt: number;
}

/**
 * Advances the scene by one frame.
 *
 * Current order:
 *   1. Physics step
 *   2. Gizmo clear
 *   3. Render sync
 *
 * Future: scripting earlyUpdate → entity update → physics → scripting lateUpdate
 *         → gizmo draw → render sync.
 */
export const updateScene = defineSceneUseCase<UpdateSceneParams, void>({
  name: 'updateScene',
  execute(scene, { dt }) {
    scene.ports.physics?.step(dt);
    scene.ports.gizmo?.clear();
    scene.ports.renderSync?.update(dt);
  },
});
