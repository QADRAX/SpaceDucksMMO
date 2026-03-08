import { BuiltInScripts } from '../generated/ScriptAssets';

/**
 * Creates a script source resolver using built-in bundled scripts.
 *
 * Returns a function that looks up a scriptId in the BuiltInScripts map.
 * Async for API compatibility (real resolvers might fetch from network/disk).
 */
export function createBuiltInScriptResolver(): (scriptId: string) => Promise<string | null> {
  return async (scriptId: string): Promise<string | null> => {
    return BuiltInScripts[scriptId] ?? null;
  };
}
