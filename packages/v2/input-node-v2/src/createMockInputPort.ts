import type { InputPort } from '@duckengine/core-v2';

/**
 * Creates a mock InputPort for tests.
 * Override specific methods as needed.
 */
export function createMockInputPort(
  overrides?: Partial<InputPort>,
): InputPort {
  const base: InputPort = {
    isKeyPressed: () => false,
    getMouseDelta: () => ({ x: 0, y: 0 }),
    getMouseButtons: () => ({ left: false, right: false, middle: false }),
    getMousePosition: () => ({ x: 0, y: 0 }),
    getMouseWheelDelta: () => 0,
    getGamepad: () => null,
    getGamepadCount: () => 0,
  };
  return { ...base, ...overrides };
}
