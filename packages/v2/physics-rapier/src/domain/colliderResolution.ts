import type { EntityState } from '@duckengine/core-v2';
import type { ColliderComponent } from '@duckengine/core-v2';
import { getComponent } from '@duckengine/core-v2';

/** Returns the first collider component on the entity, if any. */
export function getColliderComponent(entity: EntityState): ColliderComponent | undefined {
  return (
    (getComponent(entity, 'sphereCollider') as ColliderComponent | undefined) ??
    (getComponent(entity, 'boxCollider') as ColliderComponent | undefined) ??
    (getComponent(entity, 'capsuleCollider') as ColliderComponent | undefined) ??
    (getComponent(entity, 'cylinderCollider') as ColliderComponent | undefined) ??
    (getComponent(entity, 'coneCollider') as ColliderComponent | undefined) ??
    (getComponent(entity, 'terrainCollider') as ColliderComponent | undefined)
  );
}
