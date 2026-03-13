/**
 * Returns true if the script ID refers to a built-in or test script.
 * These are resolved locally rather than via the resource loader.
 *
 * @param scriptId - Script identifier (e.g. 'builtin://move_to_point.lua').
 */
export function isBuiltInOrTestScript(scriptId: string): boolean {
  return scriptId.startsWith('builtin://') || scriptId.startsWith('test://');
}
