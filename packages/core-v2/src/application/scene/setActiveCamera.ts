import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { hasComponent } from '../../domain/entities';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/** Parameters for the setActiveCamera use case. */
export interface SetActiveCameraParams {
  readonly entityId: string | null;
}

/**
 * Sets or clears the active camera entity for the scene.
 * Pass `null` to clear the active camera.
 * When setting, the entity must exist in the scene and own a `cameraView` component.
 */
export const setActiveCamera = defineSceneUseCase<SetActiveCameraParams, Result<void>>({
  name: 'setActiveCamera',
  execute(scene, { entityId }) {
    if (entityId === null) {
      if (scene.activeCameraId === null) return ok(undefined);
      scene.activeCameraId = null;
      emitSceneChange(scene, { kind: 'active-camera-changed', entityId: null });
      return ok(undefined);
    }

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
