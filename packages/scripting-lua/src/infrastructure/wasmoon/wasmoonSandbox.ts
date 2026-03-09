import { LuaFactory } from 'wasmoon';
import type { LuaEngine } from 'wasmoon';
import type { ScriptSandbox } from '../../domain/ports';
import type { ScriptBridgeContext } from '../../domain/bridges';
import { detectHooksFromSource } from '../../domain/slots';
import {
  getSandboxSecurityLua,
  getSandboxMetatablesLua,
  getSandboxRuntimeLua,
  getMathExtLua,
} from './modules';
import { callLuaGlobal } from './luaUtils';

/**
 * Creates a Lua sandbox backed by wasmoon (Lua 5.4 via WebAssembly).
 * Returns both the abstract sandbox and the raw LuaEngine.
 */
export async function createWasmoonSandbox(): Promise<{ sandbox: ScriptSandbox; engine: LuaEngine }> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();

  // Boot system scripts in order. Security runs first to remove dangerous globals
  // before any user-facing setup executes.
  lua.doStringSync(getSandboxSecurityLua());
  lua.doStringSync(getSandboxMetatablesLua());
  lua.doStringSync(getSandboxRuntimeLua());
  lua.doStringSync(getMathExtLua());

  const sandbox: ScriptSandbox = {
    detectHooks(source) {
      return detectHooksFromSource(source);
    },

    createSlot(
      slotKey: string,
      source: string,
      bridges: ScriptBridgeContext,
      properties: Record<string, unknown>,
    ): void {
      // Inject bridge APIs as Lua globals so scripts can access them directly
      // (e.g. Transform.getPosition()) and via self-proxy resolution.
      for (const [name, api] of Object.entries(bridges)) {
        lua.global.set(name, api);
      }

      // Load and register user script hooks via __LoadSlot (defined in sandbox_runtime.lua).
      // Returns false on compile/runtime error — slot is left unregistered.
      const loaded = callLuaGlobal(lua, '__LoadSlot', slotKey, source);
      if (loaded === false) return;

      // Create the self proxy and register context in __Contexts[slotKey].
      // Bridges table is passed for __SelfMT bridge resolution (self.Transform, etc.).
      const entityId = slotKey.split('::')[0] ?? slotKey;
      const rawProps: Record<string, unknown> = { ...properties };
      const bridgesTable: Record<string, unknown> = { ...bridges };
      try {
        callLuaGlobal(lua, '__WrapSelf', slotKey, entityId, rawProps, bridgesTable);
      } catch (err) {
        console.error(`[scripting-lua] __WrapSelf failed for '${slotKey}':`, err);
      }
    },

    destroySlot(slotKey: string): void {
      try {
        callLuaGlobal(lua, '__DestroySlot', slotKey);
      } catch {
        // Best-effort; slot may already be absent.
      }
    },

    callHook(slotKey: string, hook: string, dt: number, ...args: unknown[]): boolean {
      try {
        const result = callLuaGlobal(lua, '__CallHook', slotKey, hook, dt, ...args);
        return result !== false;
      } catch (err) {
        console.error(`[scripting-lua] callHook '${hook}' on '${slotKey}' threw:`, err);
        return false;
      }
    },

    syncProperties(slotKey: string, properties: Record<string, unknown>): void {
      try {
        for (const [key, value] of Object.entries(properties)) {
          callLuaGlobal(lua, '__UpdateProperty', slotKey, key, value);
        }
      } catch (err) {
        console.error(`[scripting-lua] syncProperties failed for '${slotKey}':`, err);
      }
    },

    flushDirtyProperties(slotKey: string): Set<string> | null {
      try {
        const dirty = callLuaGlobal(lua, '__FlushDirtyProperties', slotKey);
        if (!dirty || typeof dirty !== 'object') return null;
        const keys = Object.keys(dirty as Record<string, unknown>);
        return keys.length > 0 ? new Set(keys) : null;
      } catch {
        return null;
      }
    },

    dispose(): void {
      lua.global.close();
    },
  };

  return { sandbox, engine: lua };
}

