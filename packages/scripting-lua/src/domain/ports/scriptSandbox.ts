import type { ScriptHook } from '../slots';
import type { ScriptBridgeContext } from '../bridges';

/**
 * Abstract sandbox interface for script execution.
 *
 * The domain defines this contract; infrastructure implements it.
 * The wasmoon adapter (or any other runtime) fulfills this interface.
 */
export interface ScriptSandbox {
  /** Parse a script source and return which hooks it declares. */
  detectHooks(source: string): ScriptHook[];

  /** Create an execution slot for a script instance. */
  createSlot(
    slotKey: string,
    source: string,
    bridges: ScriptBridgeContext,
    properties: Record<string, unknown>,
  ): void;

  /** Destroy a slot and release its resources. */
  destroySlot(slotKey: string): void;

  /**
   * Call a lifecycle hook on a specific slot.
   * Returns `true` if the hook executed successfully, `false` on error
   * (which should disable the slot).
   */
  callHook(slotKey: string, hook: string, dt: number, ...args: unknown[]): boolean;

  /** Push updated properties into a slot (ECS → sandbox). */
  syncProperties(slotKey: string, properties: Record<string, unknown>): void;

  /**
   * Pull dirty property values from a slot (sandbox → ECS).
   * Returns a record of keys and their new values that were modified by the script,
   * or null if nothing changed.
   */
  flushDirtyProperties(slotKey: string): Record<string, unknown> | null;

  /** Tear down the entire sandbox and release all resources. */
  dispose(): void;
}
