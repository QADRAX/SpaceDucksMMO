import type { SceneState, ScriptSchema } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';

/** Physics bridge — proxies raycast, teleportBody, and collision queries. */
export const physicsBridge: BridgeDeclaration = {
  name: 'Physics',
  perEntity: false,
  factory(_scene: SceneState, _entityId, _schema: ScriptSchema | null, ports) {
    return {
      raycast(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, maxDistance: number) {
        if (!ports.physicsQuery) return null;
        return ports.physicsQuery.raycast({ origin, direction, maxDistance });
      },
      teleportBody(entityId: string, position: { x: number; y: number; z: number }) {
        ports.physicsQuery?.teleportBody?.(entityId, position);
      },
    };
  },
};
