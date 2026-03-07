import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { hasComponent } from '../../domain/ecs/entity';
import { defineSceneUseCase } from './sceneUseCase';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/** Parameters for the setActiveCamera use case. */
export interface SetActiveCameraParams {
  readonly entityId: string;
}

/**
 * Sets the active camera entity for the scene.
 * The entity must exist in the scene and own a `cameraView` component.
 */
export const setActiveCamera = defineSceneUseCase<SetActiveCameraParams, Result<void>>({
  name: 'setActiveCamera',
  execute(scene, { entityId }) {
    const entity = scene.entities.get(entityId);
    if (!entity) return err('not-found', `Entity '${entityId}' not found in scene.`);

    if (!hasComponent(entity, 'cameraView')) {
      return err('validation', `Entity '${entityId}' does not have a cameraView component.`);
    }

    scene.activeCameraId = entityId;
    emitSceneChange(scene, { kind: 'active-camera-changed', entityId });
    return ok(undefined);
  },
});
