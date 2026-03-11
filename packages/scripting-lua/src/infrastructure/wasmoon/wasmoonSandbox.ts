import { LuaFactory } from 'wasmoon';
import type { LuaEngine } from 'wasmoon';
import type { ScriptSandbox } from '../../domain/ports';
import type { ScriptBridgeContext } from '../../domain/bridges';
import type { ScriptSchema, EntityId, ComponentType, PropertyValues } from '@duckengine/core-v2';
import type { DiagnosticPort } from '@duckengine/core-v2';
import { detectHooksFromSource } from '../../domain/slots';
import {
  getSandboxSecurityLua,
  getBuiltinScriptsLua,
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
  // BuiltInScripts is defined in builtin_scripts.lua (system), not injected from TS.
  lua.doStringSync(getSandboxSecurityLua());
  lua.doStringSync(getBuiltinScriptsLua());
  lua.doStringSync(getSandboxMetatablesLua());
  lua.doStringSync(getSandboxRuntimeLua());
  lua.doStringSync(getMathExtLua());

  const bridgesBySlot = new Map<string, ScriptBridgeContext>();

  let diagnostic: DiagnosticPort | undefined;

  function bindScriptErrorReporter(
    reporter: (params: { slotKey: string; phase: 'compile' | 'load' | 'hook'; hookName?: string; message: string }) => void
  ): void {
    lua.global.set(
      '__ReportScriptError',
      (slotKey: string, phase: string, message: string, hookName?: string) => {
        reporter({
          slotKey,
          phase: phase as 'compile' | 'load' | 'hook',
          hookName: hookName ?? undefined,
          message,
        });
      },
    );
  }

  const PER_ENTITY_BRIDGES = new Set(['Transform', 'Script']);

  function createScopedBridge(
    bridge: Record<string, unknown>,
    entityId: string,
  ): Record<string, (...args: unknown[]) => unknown> {
    const scoped: Record<string, (...args: unknown[]) => unknown> = {};
    for (const [name, fn] of Object.entries(bridge)) {
      if (typeof fn === 'function') {
        scoped[name] = (...args: unknown[]) =>
          (fn as (id: string, ...a: unknown[]) => unknown)(entityId, ...args);
      }
    }
    return Object.freeze(scoped) as Record<string, (...args: unknown[]) => unknown>;
  }

  const getScopedBridge = (
    slotKey: string,
    entityId: string,
    bridgeName: string,
  ): Record<string, (...args: unknown[]) => unknown> | undefined => {
    const bridges = bridgesBySlot.get(slotKey);
    if (!bridges) return undefined;
    const bridge = bridges[bridgeName];
    if (!bridge || typeof bridge !== 'object') return undefined;
    if (PER_ENTITY_BRIDGES.has(bridgeName)) {
      return createScopedBridge(bridge as Record<string, unknown>, entityId);
    }
    return bridge as Record<string, (...args: unknown[]) => unknown>;
  };

  const sandbox: ScriptSandbox = {
    detectHooks(source) {
      return detectHooksFromSource(source);
    },

    createSlot(
      slotKey: string,
      source: string,
      bridges: ScriptBridgeContext,
      properties: PropertyValues,
      schema: ScriptSchema | null,
    ): void {
      bridgesBySlot.set(slotKey, bridges);

      // Load and register user script hooks via __LoadSlot (defined in sandbox_runtime.lua).
      // Returns false on compile/runtime error — slot is left unregistered.
      const loaded = callLuaGlobal(lua, '__LoadSlot', slotKey, source);
      if (loaded === false) return;

      // Create the self proxy and register context in __Contexts[slotKey].
      // Bridges table is passed for __SelfMT bridge resolution (self.Transform, etc.).
      const entityId = slotKey.split('::')[0] ?? slotKey;
      const rawProps: PropertyValues = { ...properties };
      const bridgesTable: Record<string, unknown> = { ...bridges };
      
      const schemaTypes: Record<string, string> = {};
      const schemaComponentTypes: Record<string, string> = {};

      if (schema) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          schemaTypes[key] = prop.type;
          if (prop.type === 'entityComponentRef' || prop.type === 'entityComponentRefArray') {
            schemaComponentTypes[key] = prop.componentType;
          }
        }
      }

      try {
        callLuaGlobal(
          lua,
          '__WrapSelf',
          slotKey,
          entityId,
          rawProps,
          bridgesTable,
          schemaTypes,
          schemaComponentTypes,
          getScopedBridge,
        );
      } catch (err) {
        diagnostic?.log('error', `__WrapSelf failed for '${slotKey}'`, { error: String(err) });
      }
    },

    destroySlot(slotKey: string): void {
      bridgesBySlot.delete(slotKey);
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
        diagnostic?.log('error', `callHook '${hook}' on '${slotKey}' threw`, { error: String(err) });
        return false;
      }
    },

    syncProperties(slotKey: string, properties: PropertyValues): void {
      try {
        for (const [key, value] of Object.entries(properties)) {
          callLuaGlobal(lua, '__UpdateProperty', slotKey, key, value);
        }
      } catch (err) {
        diagnostic?.log('error', `syncProperties failed for '${slotKey}'`, { error: String(err) });
      }
    },

    flushDirtyProperties(slotKey: string): PropertyValues | null {
      try {
        const dirty = callLuaGlobal(lua, '__FlushDirtyProperties', slotKey);
        if (!dirty || typeof dirty !== 'object') return null;
        // The sandbox_runtime.lua returns a table of { [key] = value }
        const record = dirty as PropertyValues;
        return Object.keys(record).length > 0 ? record : null;
      } catch {
        return null;
      }
    },

    dispose(): void {
      lua.global.close();
    },
    
    bindComponentAccessors(
      getter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string) => T | undefined,
      setter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string, value: T) => void
    ): void {
      lua.global.set('__GetResourceProperty', getter);
      lua.global.set('__SetResourceProperty', setter);
    },

    bindScriptErrorReporter(reporter) {
      bindScriptErrorReporter(reporter);
    },

    bindDiagnostic(port) {
      diagnostic = port;
    },
  };

  return { sandbox, engine: lua };
}

