import type { ResourceCachePort } from '@duckengine/core-v2';
import { createResourceKey, createResourceRef } from '@duckengine/core-v2';
import { isBuiltInOrTestScript } from '../domain/scriptResolution';

export interface ScriptResolver {
  resolveSource(scriptId: string): Promise<string | null>;
}

/**
 * Creates a script resolver that delegates to:
 * 1. Built-in resolver for 'builtin://' and 'test://' scripts.
 * 2. ResourceCachePort (when provided) — read from cache only. When not in cache, returns null;
 *    initScriptSlot adds to pendingScripts; resource-loaded event triggers reconcilePendingScriptsForKey.
 * When cache is absent: built-in resolver only (no resource scripts).
 */
export function createResourceScriptResolver(
  builtInResolver: (scriptId: string) => Promise<string | null>,
  resourceCache: ResourceCachePort | null | undefined
): ScriptResolver {
  return {
    async resolveSource(scriptId: string): Promise<string | null> {
      if (isBuiltInOrTestScript(scriptId)) {
        return builtInResolver(scriptId);
      }

      if (!resourceCache) return null;

      const ref = createResourceRef(createResourceKey(scriptId), 'script');
      return resourceCache.getScriptSource(ref);
    },
  };
}
