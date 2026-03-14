import type { PrefabId } from '../../domain/ids';
import { removePrefabFromState } from '../../domain/prefabs';
import { emitSceneChange } from '../../domain/scene';
import { defineSceneUseCase } from '../../domain/useCases';

export interface RemovePrefabParams {
  readonly prefabId: PrefabId;
}

/**
 * Removes a prefab from the scene and emits a ScenePrefabRemovedEvent if it existed.
 */
export const removePrefab = defineSceneUseCase<RemovePrefabParams, void>({
  name: 'scene/removePrefab',
  execute(scene, params) {
    const { prefabId } = params;
    const removed = removePrefabFromState(scene, prefabId);

    if (removed) {
      emitSceneChange(scene, { kind: 'prefab-removed', prefabId });
    }
  },
});
