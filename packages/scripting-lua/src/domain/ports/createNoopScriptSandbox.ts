import type { ScriptSandbox } from './scriptSandbox';

/**
 * No-op sandbox used as a safe fallback while runtime sandbox boots.
 */
export function createNoopScriptSandbox(): ScriptSandbox {
  return {
    detectHooks(_source: string) {
      return [];
    },
    createSlot() {
      // no-op
    },
    destroySlot() {
      // no-op
    },
    callHook() {
      return true;
    },
    syncProperties() {
      // no-op
    },
    flushDirtyProperties() {
      return null;
    },
    dispose() {
      // no-op
    },
  };
}
