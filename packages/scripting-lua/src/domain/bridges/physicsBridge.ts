import type { BridgeDeclaration } from './types';

/** Physics bridge — proxies raycast and collision queries. */
export const physicsBridge: BridgeDeclaration = {
  name: 'Physics',
  perEntity: false,
  factory(_scene, _entityId, ports) {
    return {
      raycast(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, maxDistance: number) {
        if (!ports.physicsQuery) return null;
        return ports.physicsQuery.raycast({ origin, direction, maxDistance });
      },
    };
  },
};
