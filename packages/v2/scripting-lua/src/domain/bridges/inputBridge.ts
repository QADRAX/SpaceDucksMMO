import type { SceneState, ScriptSchema } from '@duckengine/core-v2';
import { buildInputAPI } from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

const ZERO_DELTA = { x: 0, y: 0 };
const ZERO_BUTTONS = { left: false, right: false, middle: false };

/** Input bridge — exposes keyboard, mouse, gamepad, and action API to scripts. */
export const inputBridge: BridgeDeclaration = {
  name: 'Input',
  perEntity: false,
  factory(_scene: SceneState, _entityId, _schema: ScriptSchema | null, ports: BridgePorts) {
    const input = ports.input;
    const inputApi = buildInputAPI({
      isKeyPressed: (key) => input?.isKeyPressed(key) ?? false,
      getMouseDelta: () => input?.getMouseDelta?.() ?? ZERO_DELTA,
      getMousePosition: () => input?.getMousePosition?.() ?? ZERO_DELTA,
    });

    return {
      isKeyPressed(key: string) {
        return inputApi.isKeyPressed(key);
      },
      getMouseDelta() {
        return inputApi.getMouseDelta();
      },
      getMouseButtons() {
        return input?.getMouseButtons?.() ?? ZERO_BUTTONS;
      },
      getMousePosition() {
        return inputApi.getMousePosition();
      },
      getMouseWheelDelta() {
        return input?.getMouseWheelDelta?.() ?? 0;
      },
      getGamepad(index: number) {
        return input?.getGamepad?.(index) ?? null;
      },
      getGamepadCount() {
        return input?.getGamepadCount?.() ?? 0;
      },
      requestPointerLock() {
        input?.requestPointerLock?.();
      },
      exitPointerLock() {
        input?.exitPointerLock?.();
      },
      isPointerLocked() {
        return input?.isPointerLocked?.() ?? false;
      },
      getAction(action: string) {
        return input?.getAction?.(action) ?? 0;
      },
      getAction2(actionX: string, actionY: string) {
        return input?.getAction2?.(actionX, actionY) ?? { x: 0, y: 0 };
      },
      isActionPressed(action: string) {
        return input?.isActionPressed?.(action) ?? false;
      },
    };
  },
};
