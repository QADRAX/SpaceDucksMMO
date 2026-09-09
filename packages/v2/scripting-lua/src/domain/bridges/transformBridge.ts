import type { EntityId, SceneState, ScriptSchema, Transform3dComponent } from '@duckengine/core-v2';
import {
  setPosition,
  setRotation,
  setScale,
  lookAt,
  getPosition,
  getRotation,
  getScale,
  getLocalPosition,
  getLocalRotation,
  getLocalScale,
  getForward,
  getRight,
  getTransform3d,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

type Vec3Arg = number | { x: number; y: number; z: number };

function asXYZ(
  x: Vec3Arg,
  y?: number,
  z?: number,
): { x: number; y: number; z: number } | undefined {
  if (typeof x === 'object') return { x: x.x, y: x.y, z: x.z };
  if (typeof y !== 'number' || typeof z !== 'number') return undefined;
  return { x, y, z };
}

/**
 * Transform bridge — facade over ECS `transform3d`.
 * Soft null-logic: missing or disabled pose → getters `undefined`, setters `false`, {@link has} → false.
 * Prefer this over `Component.getField('transform3d', …)` for spatial gameplay.
 */
export const transformBridge: BridgeDeclaration = {
  name: 'Transform',
  perEntity: true,
  factory(scene: SceneState, _entityId, _schema: ScriptSchema | null, _ports: BridgePorts) {
    const resolve = (targetId: EntityId): Transform3dComponent | undefined => {
      const e = scene.entities.get(targetId);
      if (!e) return undefined;
      return getTransform3d(e);
    };

    return {
      /** True when the entity has an active (present + enabled) transform3d. */
      has(id: EntityId): boolean {
        return resolve(id) !== undefined;
      },

      getPosition(id: EntityId) {
        const t = resolve(id);
        return t ? getPosition(t) : undefined;
      },
      setPosition(id: EntityId, x: Vec3Arg, y?: number, z?: number): boolean {
        const t = resolve(id);
        const v = asXYZ(x, y, z);
        if (!t || !v) return false;
        setPosition(t, v.x, v.y, v.z);
        return true;
      },

      getRotation(id: EntityId) {
        const t = resolve(id);
        return t ? getRotation(t) : undefined;
      },
      setRotation(id: EntityId, x: Vec3Arg, y?: number, z?: number): boolean {
        const t = resolve(id);
        const v = asXYZ(x, y, z);
        if (!t || !v) return false;
        setRotation(t, v.x, v.y, v.z);
        return true;
      },

      getScale(id: EntityId) {
        const t = resolve(id);
        return t ? getScale(t) : undefined;
      },
      setScale(id: EntityId, x: Vec3Arg, y?: number, z?: number): boolean {
        const t = resolve(id);
        const v = asXYZ(x, y, z);
        if (!t || !v) return false;
        setScale(t, v.x, v.y, v.z);
        return true;
      },

      getLocalPosition(id: EntityId) {
        const t = resolve(id);
        return t ? getLocalPosition(t) : undefined;
      },
      getLocalRotation(id: EntityId) {
        const t = resolve(id);
        return t ? getLocalRotation(t) : undefined;
      },
      getLocalScale(id: EntityId) {
        const t = resolve(id);
        return t ? getLocalScale(t) : undefined;
      },

      lookAt(id: EntityId, target: { x: number; y: number; z: number }): boolean {
        const t = resolve(id);
        if (!t) return false;
        lookAt(t, target);
        return true;
      },

      getForward(id: EntityId) {
        const t = resolve(id);
        if (!t) return undefined;
        const v = getForward(t);
        return { x: v.x, y: v.y, z: v.z };
      },
      getRight(id: EntityId) {
        const t = resolve(id);
        if (!t) return undefined;
        const v = getRight(t);
        return { x: v.x, y: v.y, z: v.z };
      },
    };
  },
};
