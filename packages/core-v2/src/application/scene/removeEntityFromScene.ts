import type { SceneState } from '../../domain/types/sceneState';
import type { EntityState } from '../../domain/ecs/entity';
import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { defineSceneUseCase } from './sceneUseCase';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/** Parameters for the removeEntityFromScene use case. */
export interface RemoveEntityParams {
  readonly entityId: string;
}

/**
 * Removes an entity (and its entire subtree) from a scene.
 * Detaches observers, notifies ports, and emits events for each removed entity.
 */
export const removeEntityFromScene = defineSceneUseCase<RemoveEntityParams, Result<void>>({
  name: 'removeEntityFromScene',
  execute(scene, { entityId }) {
    const entity = scene.entities.get(entityId);
    if (!entity) {
      return err('not-found', `Entity '${entityId}' not found in scene.`);
    }

    removeEntityRecursive(scene, entity);

    const rootIdx = scene.rootEntityIds.indexOf(entityId);
    if (rootIdx >= 0) {
      scene.rootEntityIds.splice(rootIdx, 1);
    }

    if (scene.activeCameraId === entityId) {
      scene.activeCameraId = null;
      emitSceneChange(scene, { kind: 'active-camera-changed', entityId: null });
    }

    return ok(undefined);
  },
});

function removeEntityRecursive(scene: SceneState, entity: EntityState): void {
  for (const child of [...entity.children]) {
    removeEntityRecursive(scene, child);
  }

  const cleanup = scene.entityCleanups.get(entity.id);
  if (cleanup) {
    try {
      cleanup();
    } catch {
      /* swallow */
    }
    scene.entityCleanups.delete(entity.id);
  }

  scene.ports.renderSync?.removeEntity(entity.id);
  scene.ports.physics?.removeEntity(entity.id);

  scene.entities.delete(entity.id);

  emitSceneChange(scene, { kind: 'entity-removed', entityId: entity.id });
}
