import type { InputAPI, InputAPIBuildContext } from './types';

const ZERO_VEC2 = { x: 0, y: 0 };

/**
 * Builds an input API from host-provided callbacks.
 */
export function buildInputAPI(context: InputAPIBuildContext): InputAPI {
  return {
    isKeyPressed(key) {
      return context.isKeyPressed?.(key) ?? false;
    },

    isKeyJustPressed(key) {
      return context.isKeyJustPressed?.(key) ?? false;
    },

    isKeyReleased(key) {
      return context.isKeyReleased?.(key) ?? false;
    },

    getMousePosition() {
      return context.getMousePosition?.() ?? ZERO_VEC2;
    },

    getMouseDelta() {
      return context.getMouseDelta?.() ?? ZERO_VEC2;
    },

    isMouseButtonPressed(button) {
      return context.isMouseButtonPressed?.(button) ?? false;
    },
  };
}
