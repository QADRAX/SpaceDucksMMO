import type { SceneState, ScriptSchema, EntityId } from '@duckengine/core-v2';
import {
  setPosition,
  setRotation,
  setScale,
  lookAt,
  ensureClean,
} from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';

/** Transform bridge — scoped to a single entity's transform. */
export const transformBridge: BridgeDeclaration = {
  name: 'Transform',
  perEntity: true,
  factory(scene: SceneState, _entityId: string, _schema: ScriptSchema | null) {
    const resolve = (targetId: string) => {
      const e = scene.entities.get(targetId as EntityId);
      if (!e) throw new Error(`Entity '${targetId}' not in scene.`);
      return e.transform;
    };

    return {
      getPosition(id: string) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldPosition.x, y: t.worldPosition.y, z: t.worldPosition.z };
      },
      setPosition(id: string, x: number, y: number, z: number) {
        setPosition(resolve(id), x, y, z);
      },
      getRotation(id: string) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldRotation.x, y: t.worldRotation.y, z: t.worldRotation.z };
      },
      setRotation(id: string, x: number, y: number, z: number) {
        setRotation(resolve(id), x, y, z);
      },
      getScale(id: string) {
        const t = resolve(id);
        ensureClean(t);
        return { x: t.worldScale.x, y: t.worldScale.y, z: t.worldScale.z };
      },
      setScale(id: string, x: number, y: number, z: number) {
        setScale(resolve(id), x, y, z);
      },
      getLocalPosition(id: string) {
        const t = resolve(id);
        return { x: t.localPosition.x, y: t.localPosition.y, z: t.localPosition.z };
      },
      getLocalRotation(id: string) {
        const t = resolve(id);
        return { x: t.localRotation.x, y: t.localRotation.y, z: t.localRotation.z };
      },
      getLocalScale(id: string) {
        const t = resolve(id);
        return { x: t.localScale.x, y: t.localScale.y, z: t.localScale.z };
      },
      lookAt(id: string, target: { x: number; y: number; z: number }) {
        lookAt(resolve(id), target);
      },
    };
  },
};
