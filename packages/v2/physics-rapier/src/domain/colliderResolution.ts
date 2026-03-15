import type { EntityState } from '@duckengine/core-v2';
import type { ColliderComponent } from '@duckengine/core-v2';
import { getComponent } from '@duckengine/core-v2';

/** Returns the first collider component on the entity, if any. */
export function getColliderComponent(entity: EntityState): ColliderComponent | undefined {
  return (
    getComponent<ColliderComponent>(entity, 'sphereCollider') ??
    getComponent<ColliderComponent>(entity, 'boxCollider') ??
    getComponent<ColliderComponent>(entity, 'capsuleCollider') ??
    getComponent<ColliderComponent>(entity, 'cylinderCollider') ??
    getComponent<ColliderComponent>(entity, 'coneCollider') ??
    getComponent<ColliderComponent>(entity, 'terrainCollider') ??
    getComponent<ColliderComponent>(entity, 'trimeshCollider')
  );
}
