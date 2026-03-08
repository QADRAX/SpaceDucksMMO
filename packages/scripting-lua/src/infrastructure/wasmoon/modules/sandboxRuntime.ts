import { SystemScripts } from '../generated/ScriptAssets';

/**
 * Gets the Lua runtime helpers for the scripting sandbox.
 * Defines __WrapSelf, __CallHook, __UpdateProperty, __WrapValue.
 * These are the core runtime functions that the TypeScript sandbox calls into Lua.
 */
export function getSandboxRuntimeLua(): string {
  return SystemScripts['sandbox_runtime'] ?? '';
}

/** @deprecated Use getSandboxRuntimeLua() instead. */
export const SANDBOX_RUNTIME_LUA = getSandboxRuntimeLua();
