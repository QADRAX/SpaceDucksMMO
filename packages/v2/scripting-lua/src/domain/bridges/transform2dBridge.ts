import type {
  EntityId,
  SceneState,
  ScriptSchema,
  Transform2dComponent,
} from '@duckengine/core-v2';
import {
  getTransform2d,
  getTransform2dComponent,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

type Vec2Arg = number | { x: number; y: number };

function asXY(x: Vec2Arg, y?: number): { x: number; y: number } | undefined {
  if (typeof x === 'object') return { x: x.x, y: x.y };
  if (typeof y !== 'number') return undefined;
  return { x, y };
}

/**
 * Transform2D bridge — facade over ECS `transform2d` (screen UI roots).
 * Soft null-logic when missing or disabled.
 */
export const transform2dBridge: BridgeDeclaration = {
  name: 'Transform2D',
  perEntity: true,
  factory(scene: SceneState, _entityId, _schema: ScriptSchema | null, _ports: BridgePorts) {
    const resolve = (targetId: EntityId): Transform2dComponent | undefined => {
      const e = scene.entities.get(targetId);
      if (!e) return undefined;
      return getTransform2d(e);
    };

    return {
      has(id: EntityId): boolean {
        return resolve(id) !== undefined;
      },

      isEnabled(id: EntityId): boolean | undefined {
        const e = scene.entities.get(id);
        if (!e) return undefined;
        const t = getTransform2dComponent(e);
        return t ? t.enabled : undefined;
      },

      setEnabled(id: EntityId, enabled: boolean): boolean {
        const e = scene.entities.get(id);
        if (!e) return false;
        const t = getTransform2dComponent(e);
        if (!t) return false;
        t.enabled = !!enabled;
        e.observers.fireComponentChanged(id, 'transform2d');
        return true;
      },

      getPosition(id: EntityId) {
        const t = resolve(id);
        return t ? { ...t.localPosition } : undefined;
      },
      setPosition(id: EntityId, x: Vec2Arg, y?: number): boolean {
        const t = resolve(id);
        const v = asXY(x, y);
        if (!t || !v) return false;
        t.localPosition.x = v.x;
        t.localPosition.y = v.y;
        t.dirty = true;
        return true;
      },

      getSize(id: EntityId) {
        const t = resolve(id);
        return t ? { ...t.localSize } : undefined;
      },
      setSize(id: EntityId, x: Vec2Arg, y?: number): boolean {
        const t = resolve(id);
        const v = asXY(x, y);
        if (!t || !v) return false;
        t.localSize.x = v.x;
        t.localSize.y = v.y;
        t.dirty = true;
        return true;
      },

      getRotation(id: EntityId) {
        return resolve(id)?.localRotation;
      },
      setRotation(id: EntityId, rotation: number): boolean {
        const t = resolve(id);
        if (!t) return false;
        t.localRotation = rotation;
        t.dirty = true;
        return true;
      },

      getZIndex(id: EntityId) {
        return resolve(id)?.zIndex;
      },
      setZIndex(id: EntityId, zIndex: number): boolean {
        const t = resolve(id);
        if (!t) return false;
        t.zIndex = zIndex;
        t.dirty = true;
        return true;
      },
    };
  },
};
