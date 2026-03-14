import type { PrefabId } from '../ids';
import type { EntityState } from '../entities';
import type { SceneState } from '../scene';

/**
 * Adds an entity as a prefab to the scene state.
 * Prefabs act as a cache of instantiable entities that do not reside in the active scene graph.
 *
 * @param scene - The scene to add the prefab to.
 * @param prefabId - Unique identifier for the prefab.
 * @param entity - The entity state acting as the prefab template.
 */
export function addPrefabToState(
  scene: SceneState,
  prefabId: PrefabId,
  entity: EntityState,
): void {
  scene.prefabs.set(prefabId, entity);
}

/**
 * Removes a prefab from the scene state.
 *
 * @param scene - The scene to remove the prefab from.
 * @param prefabId - The unique identifier of the prefab.
 * @returns True if the prefab existed and was removed, false otherwise.
 */
export function removePrefabFromState(
  scene: SceneState,
  prefabId: PrefabId,
): boolean {
  return scene.prefabs.delete(prefabId);
}
