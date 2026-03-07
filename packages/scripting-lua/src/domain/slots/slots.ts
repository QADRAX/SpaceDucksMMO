import type { ScriptSlotState, ScriptHook } from './types';

/**
 * Creates a new script slot state for a given entity + script pair.
 *
 * @param entityId   - The owning entity's ID.
 * @param scriptId   - The script identifier (e.g. 'ai/patrol').
 * @param properties - Initial properties from the ECS ScriptReference.
 * @param hooks      - Set of hooks the script source declares.
 */
export function createScriptSlot(
  entityId: string,
  scriptId: string,
  properties: Record<string, unknown>,
  hooks: ReadonlyArray<ScriptHook>,
): ScriptSlotState {
  return {
    entityId,
    scriptId,
    enabled: true,
    properties: { ...properties },
    dirtyKeys: new Set(),
    declaredHooks: new Set(hooks),
    sandboxHandle: undefined,
  };
}

/**
 * Generates a deterministic slot key from entity + script IDs.
 * Used as the lookup key in the adapter's slot registry.
 */
export function slotKey(entityId: string, scriptId: string): string {
  return `${entityId}::${scriptId}`;
}
