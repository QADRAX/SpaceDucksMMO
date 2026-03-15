import type { InputPort } from '@duckengine/core-v2';

/**
 * Creates a no-op InputPort for Node/headless environments.
 * All methods return empty/default values.
 */
export function createNoopInputPort(): InputPort {
  return {
    isKeyPressed: () => false,
    getMouseDelta: () => ({ x: 0, y: 0 }),
    getMouseButtons: () => ({ left: false, right: false, middle: false }),
    getMousePosition: () => ({ x: 0, y: 0 }),
    getMouseWheelDelta: () => 0,
    getGamepad: () => null,
    getGamepadCount: () => 0,
  };
}
