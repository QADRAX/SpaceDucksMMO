import type { EntityId, PrefabId } from '../../domain/ids';
import { cloneEntitySubtree } from '../../domain/entities';
import { setPosition, setRotation } from '../../domain/entities';
import { getTransform3d } from '../../domain/entities/transform3dAccess';
import { addComponent } from '../../domain/entities';
import { createComponent } from '../../domain/components';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineSceneUseCase } from '../../domain/useCases';
import { addEntityToScene } from '../scene/addEntityToScene';

function generateEntityId(): EntityId {
  return (typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `e-${Math.random().toString(36).slice(2, 11)}`) as EntityId;
}

export interface InstantiatePrefabParams {
  readonly prefabId: PrefabId;
  readonly position?: { x: number; y: number; z: number };
  readonly rotation?: { x: number; y: number; z: number };
}

/**
 * Instantiates a prefab by cloning its entity template and adding it to the scene.
 * Applies optional position and rotation to the root transform3d (adds one if missing).
 * Returns the new entity ID on success.
 */
export const instantiatePrefab = defineSceneUseCase<
  InstantiatePrefabParams,
  Result<EntityId>
>({
  name: 'scene/instantiatePrefab',
  execute(scene, params) {
    const { prefabId, position, rotation } = params;

    const template = scene.prefabs.get(prefabId);
    if (!template) {
      return err('not-found', `Prefab '${prefabId}' not found.`);
    }

    const clone = cloneEntitySubtree(template, generateEntityId);

    if (position || rotation) {
      let state = getTransform3d(clone);
      if (!state) {
        const addResult = addComponent(clone, createComponent('transform3d'));
        if (!addResult.ok) return addResult;
        state = getTransform3d(clone);
      }
      if (!state) {
        return err('validation', 'Failed to ensure transform3d on prefab instance.');
      }
      if (position) {
        setPosition(state, position.x, position.y, position.z);
      }
      if (rotation) {
        setRotation(state, rotation.x, rotation.y, rotation.z);
      }
    }

    const addResult = addEntityToScene.execute(scene, { entity: clone });
    if (!addResult.ok) {
      return addResult;
    }

    return ok(clone.id);
  },
});
