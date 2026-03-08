import type { SceneState, ScriptSchema } from '@duckengine/core-v2';
import { buildInputAPI } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';

/** Input bridge — exposes keyboard and mouse state to scripts. */
export const inputBridge: BridgeDeclaration = {
  name: 'Input',
  perEntity: false,
  factory(_scene: SceneState, _entityId: string, _schema: ScriptSchema | null, ports) {
    const inputApi = buildInputAPI({
      isKeyPressed: (key) => ports.input?.isKeyPressed(key) ?? false,
      getMouseDelta: () => ports.input?.getMouseDelta() ?? { x: 0, y: 0 },
    });

    return {
      isKeyPressed(key: string) {
        return inputApi.isKeyPressed(key);
      },
      getMouseDelta() {
        return inputApi.getMouseDelta();
      },
      getMouseButtons() {
        return ports.input?.getMouseButtons() ?? { left: false, right: false, middle: false };
      },
    };
  },
};
