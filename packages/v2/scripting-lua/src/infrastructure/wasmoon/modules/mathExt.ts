import { SystemScripts } from '../generated/ScriptAssets';

/**
 * Gets the Lua math extensions for the scripting sandbox.
 * Provides vec3 with operator overloading and math.ext utilities
 * (lerp, clamp, easing functions, etc.).
 */
export function getMathExtLua(): string {
  return SystemScripts['math_ext'] ?? '';
}

/** @deprecated Use getMathExtLua() instead. */
export const MATH_EXT_LUA = getMathExtLua();
