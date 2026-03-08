import type { SceneState, ScriptSchema } from '@duckengine/core-v2';
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
  factory(scene: SceneState, entityId: string, _schema: ScriptSchema | null) {
    const resolve = () => {
      const e = scene.entities.get(entityId);
      if (!e) throw new Error(`Entity '${entityId}' not in scene.`);
      return e.transform;
    };

    return {
      getPosition() {
        const t = resolve();
        ensureClean(t);
        return { x: t.worldPosition.x, y: t.worldPosition.y, z: t.worldPosition.z };
      },
      setPosition(x: number, y: number, z: number) {
        setPosition(resolve(), x, y, z);
      },
      getRotation() {
        const t = resolve();
        ensureClean(t);
        return { x: t.worldRotation.x, y: t.worldRotation.y, z: t.worldRotation.z };
      },
      setRotation(x: number, y: number, z: number) {
        setRotation(resolve(), x, y, z);
      },
      getScale() {
        const t = resolve();
        ensureClean(t);
        return { x: t.worldScale.x, y: t.worldScale.y, z: t.worldScale.z };
      },
      setScale(x: number, y: number, z: number) {
        setScale(resolve(), x, y, z);
      },
      getLocalPosition() {
        const t = resolve();
        return { x: t.localPosition.x, y: t.localPosition.y, z: t.localPosition.z };
      },
      getLocalRotation() {
        const t = resolve();
        return { x: t.localRotation.x, y: t.localRotation.y, z: t.localRotation.z };
      },
      getLocalScale() {
        const t = resolve();
        return { x: t.localScale.x, y: t.localScale.y, z: t.localScale.z };
      },
      lookAt(target: { x: number; y: number; z: number }) {
        lookAt(resolve(), target);
      },
    };
  },
};
