import type { ScriptHook } from '../../domain/slots';
import type { ScriptBridgeContext } from '../../domain/bridges';
import type { ScriptSandbox } from '../../domain/ports';

/** Internal state for a single slot in the mock sandbox. */
interface MockSlot {
  hooks: Record<string, Function>;
  properties: Record<string, unknown>;
  bridges: ScriptBridgeContext;
  dirtyKeys: Set<string>;
}

/**
 * Creates a mock sandbox for testing that runs JS functions
 * instead of Lua. Script source is expected to be a JSON
 * with hook names as keys.
 *
 * In real usage, this is replaced by the wasmoon sandbox.
 */
export function createMockSandbox(): ScriptSandbox {
  const slotsMap = new Map<string, MockSlot>();

  return {
    detectHooks(source: string): ScriptHook[] {
      try {
        const parsed = JSON.parse(source);
        return Object.keys(parsed).filter(
          (k) => typeof parsed[k] === 'string',
        ) as ScriptHook[];
      } catch {
        return [];
      }
    },

    createSlot(key, _source, bridges, properties) {
      slotsMap.set(key, {
        hooks: {},
        properties: { ...properties },
        bridges,
        dirtyKeys: new Set(),
      });
    },

    destroySlot(key) {
      slotsMap.delete(key);
    },

    callHook(key, hook, _dt, ..._args) {
      const slot = slotsMap.get(key);
      if (!slot) return false;
      const fn = slot.hooks[hook];
      if (typeof fn === 'function') {
        try {
          fn();
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },

    syncProperties(key, properties) {
      const slot = slotsMap.get(key);
      if (!slot) return;
      slot.properties = { ...properties };
    },

    flushDirtyProperties(key) {
      const slot = slotsMap.get(key);
      if (!slot || slot.dirtyKeys.size === 0) return null;
      const keys = new Set(slot.dirtyKeys);
      slot.dirtyKeys.clear();
      return keys;
    },

    dispose() {
      slotsMap.clear();
    },
  };
}
