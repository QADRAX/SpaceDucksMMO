import type { BridgeDeclaration } from './types';

/** Input bridge — exposes keyboard and mouse state to scripts. */
export const inputBridge: BridgeDeclaration = {
  name: 'Input',
  perEntity: false,
  factory(_scene, _entityId, ports) {
    return {
      isKeyPressed(key: string) {
        return ports.input?.isKeyPressed(key) ?? false;
      },
      getMouseDelta() {
        return ports.input?.getMouseDelta() ?? { x: 0, y: 0 };
      },
      getMouseButtons() {
        return ports.input?.getMouseButtons() ?? { left: false, right: false, middle: false };
      },
    };
  },
};
