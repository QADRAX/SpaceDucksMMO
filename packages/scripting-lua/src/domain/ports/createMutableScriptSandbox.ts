import type { ScriptSandbox } from './scriptSandbox';

export interface MutableScriptSandbox {
  readonly sandbox: ScriptSandbox;
  setTarget(next: ScriptSandbox): void;
}

/**
 * Creates a proxy sandbox whose target implementation can be swapped at runtime.
 */
export function createMutableScriptSandbox(initial: ScriptSandbox): MutableScriptSandbox {
  let target = initial;

  const sandbox: ScriptSandbox = {
    detectHooks(source) {
      return target.detectHooks(source);
    },
    createSlot(slotKey, source, bridges, properties) {
      target.createSlot(slotKey, source, bridges, properties);
    },
    destroySlot(slotKey) {
      target.destroySlot(slotKey);
    },
    callHook(slotKey, hook, dt, ...args) {
      return target.callHook(slotKey, hook, dt, ...args);
    },
    syncProperties(slotKey, properties) {
      target.syncProperties(slotKey, properties);
    },
    flushDirtyProperties(slotKey) {
      return target.flushDirtyProperties(slotKey);
    },
    dispose() {
      target.dispose();
    },
  };

  return {
    sandbox,
    setTarget(next: ScriptSandbox) {
      target = next;
    },
  };
}
