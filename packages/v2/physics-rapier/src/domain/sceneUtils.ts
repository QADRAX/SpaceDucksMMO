import type { SceneState, EntityState, EntityId } from '@duckengine/core-v2';

/** Resolves an entity by id from a scene. */
export function getEntity(scene: SceneState, id: string): EntityState | null {
  return scene.entities.get(id as EntityId) ?? null;
}
