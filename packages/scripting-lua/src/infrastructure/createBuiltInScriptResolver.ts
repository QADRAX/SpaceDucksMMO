import { BuiltInScripts } from './wasmoon/generated/ScriptAssets';
import { TestScripts } from './wasmoon/generated/TestScriptAssets';

/**
 * Creates a script source resolver for bundled scripts (builtin + test).
 *
 * Handles:
 * - builtin:// — BuiltInScripts (production scripts)
 * - test:// — TestScripts (integration test scripts from res/scripts/tests)
 *
 * Async for API compatibility (real resolvers might fetch from network/disk).
 */
export function createBuiltInScriptResolver(): (scriptId: string) => Promise<string | null> {
  return async (scriptId: string): Promise<string | null> => {
    if (scriptId.startsWith('test://')) {
      return TestScripts[scriptId] ?? null;
    }
    return BuiltInScripts[scriptId] ?? null;
  };
}
