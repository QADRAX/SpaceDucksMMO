import type { EntityId, SceneState, ScriptSchema } from '@duckengine/core-v2';
import {
  setPosition,
  setRotation,
  setScale,
  lookAt,
  ensureClean,
  getForward,
  getRight,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

/** Transform bridge — scoped to a single entity's transform. Receives EntityId from createScopedBridge. */
export const transformBridge: BridgeDeclaration = {
  name: 'Transform',
  perEntity: true,
  factory(scene: SceneState, _entityId, _schema: ScriptSchema | null, _ports: BridgePorts) {
    const resolve = (targetId: EntityId) => {
      const e = scene.entities.get(targetId);
      if (!e) throw new Error(`Entity '${targetId}' not in scene.`);
      return e.transform;
    };

    return {
      getPosition(id: EntityId) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldPosition.x, y: t.worldPosition.y, z: t.worldPosition.z };
      },
      setPosition(id: EntityId, x: number | { x: number; y: number; z: number }, y?: number, z?: number) {
        if (typeof x === 'object') {
          setPosition(resolve(id), x.x, x.y, x.z);
        } else {
          setPosition(resolve(id), x, y!, z!);
        }
      },
      getRotation(id: EntityId) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldRotation.x, y: t.worldRotation.y, z: t.worldRotation.z };
      },
      setRotation(id: EntityId, x: number | { x: number; y: number; z: number }, y?: number, z?: number) {
        if (typeof x === 'object') {
          setRotation(resolve(id), x.x, x.y, x.z);
        } else {
          setRotation(resolve(id), x, y!, z!);
        }
      },
      getScale(id: EntityId) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldScale.x, y: t.worldScale.y, z: t.worldScale.z };
      },
      setScale(id: EntityId, x: number | { x: number; y: number; z: number }, y?: number, z?: number) {
        if (typeof x === 'object') {
          setScale(resolve(id), x.x, x.y, x.z);
        } else {
          setScale(resolve(id), x, y!, z!);
        }
      },
      getLocalPosition(id: EntityId) {
        const t = resolve(id);
        return { x: t.localPosition.x, y: t.localPosition.y, z: t.localPosition.z };
      },
      getLocalRotation(id: EntityId) {
        const t = resolve(id);
        return { x: t.localRotation.x, y: t.localRotation.y, z: t.localRotation.z };
      },
      getLocalScale(id: EntityId) {
        const t = resolve(id);
        return { x: t.localScale.x, y: t.localScale.y, z: t.localScale.z };
      },
      lookAt(id: EntityId, target: { x: number; y: number; z: number }) {
        lookAt(resolve(id), target);
      },
      getForward(id: EntityId) {
        const t = resolve(id);
        const v = getForward(t);
        return { x: v.x, y: v.y, z: v.z };
      },
      getRight(id: EntityId) {
        const t = resolve(id);
        const v = getRight(t);
        return { x: v.x, y: v.y, z: v.z };
      },
    };
  },
};
