import type { EntityId, PrefabId } from '../../domain/ids';
import { cloneEntitySubtree } from '../../domain/entities';
import { setPosition, setRotation } from '../../domain/entities';
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
 * Applies optional position and rotation to the root transform.
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

    if (position) {
      setPosition(clone.transform, position.x, position.y, position.z);
    }
    if (rotation) {
      setRotation(clone.transform, rotation.x, rotation.y, rotation.z);
    }

    const addResult = addEntityToScene.execute(scene, { entity: clone });
    if (!addResult.ok) {
      return addResult;
    }

    return ok(clone.id);
  },
});
