import type { PhysicsQueryPort, PhysicsRay, PhysicsRaycastHit } from '@duckengine/core-v2';
import { norm } from '../domain';
import { getRapier } from './rapier';
import type { PhysicsWorldState } from './types';

/**
 * Creates an implementation of PhysicsQueryPort that uses the given physics world state.
 */
export function createPhysicsQueryPortImpl(state: PhysicsWorldState): PhysicsQueryPort {
  return {
    raycast(ray: PhysicsRay): PhysicsRaycastHit | null {
      const world = state.world;
      const R = getRapier();
      const dx = ray.direction.x;
      const dy = ray.direction.y;
      const dz = ray.direction.z;
      const len = norm(dx, dy, dz);
      if (!Number.isFinite(len) || len <= 0) return null;
      const maxToi = ray.maxDistance ?? 1000;
      const rayObj = new R.Ray(
        { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
        { x: dx / len, y: dy / len, z: dz / len }
      );
      const cast = (world as { castRayAndGetNormal?(r: unknown, t: number, s: boolean): unknown }).castRayAndGetNormal
        ?? (world as { castRay?(r: unknown, t: number, s: boolean): unknown }).castRay;
      const hit = cast?.call(world, rayObj, maxToi, true) as { collider: number; timeOfImpact?: number; toi?: number; normal?: { x: number; y: number; z: number } } | null;
      if (!hit) return null;
      const handle = typeof hit.collider === 'number' ? hit.collider : (hit.collider as { handle?: number })?.handle;
      const entityId = (state.collisions as { getBodyOwnerIdFromHandle?(h: number): string | undefined }).getBodyOwnerIdFromHandle?.(handle ?? -1) ?? '';
      const toi = hit.timeOfImpact ?? hit.toi ?? 0;
      const normal = hit.normal ?? { x: 0, y: 1, z: 0 };
      return {
        entityId,
        point: {
          x: ray.origin.x + (dx / len) * toi,
          y: ray.origin.y + (dy / len) * toi,
          z: ray.origin.z + (dz / len) * toi,
        },
        normal: { x: normal.x, y: normal.y, z: normal.z },
        distance: toi,
      };
    },

    getCollisionEvents(): import('@duckengine/core-v2').PhysicsCollisionEvent[] {
      return state.collisions.getAccumulatedEvents();
    },

    teleportBody(entityId: string, position: { x: number; y: number; z: number }): void {
      state.teleportBody?.(entityId, position);
    },
  };
}
