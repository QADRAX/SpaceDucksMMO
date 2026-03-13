import type { EntityState } from '../../domain/entities';
import { addPrefabToState } from '../../domain/prefabs';
import { emitSceneChange } from '../../domain/scene';
import { defineSceneUseCase } from '../../domain/useCases';

export interface AddPrefabParams {
  readonly prefabId: string;
  readonly entity: EntityState;
}

/**
 * Adds an entity state as a prefab to the scene and emits a ScenePrefabAddedEvent.
 */
export const addPrefab = defineSceneUseCase<AddPrefabParams, void>({
  name: 'scene/addPrefab',
  execute(scene, params) {
    const { prefabId, entity } = params;
    addPrefabToState(scene, prefabId, entity);
    emitSceneChange(scene, { kind: 'prefab-added', prefabId });
  },
});
