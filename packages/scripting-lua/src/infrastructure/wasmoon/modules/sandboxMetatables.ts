import { SystemScripts } from '../../../generated/ScriptAssets';

/**
 * Gets the Lua metatable definitions for the scripting sandbox.
 * Defines __SelfMT, __EntityMT, __ComponentMT, __ScriptsProxyMT,
 * and __ScriptSlotMT. These metatables compose the `self` proxy
 * chain that scripts interact with.
 */
export function getSandboxMetatablesLua(): string {
  return SystemScripts['sandbox_metatables'] ?? '';
}

/** @deprecated Use getSandboxMetatablesLua() instead. */
export const SANDBOX_METATABLES_LUA = getSandboxMetatablesLua();
