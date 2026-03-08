import { SystemScripts } from '../generated/ScriptAssets';

/**
 * Gets the Lua sandbox security module.
 * Removes dangerous globals (os, io, debug, loadfile, dofile, etc.)
 * to prevent scripts from accessing the host filesystem or process.
 */
export function getSandboxSecurityLua(): string {
  return SystemScripts['sandbox_security'] ?? '';
}

/** @deprecated Use getSandboxSecurityLua() instead. */
export const SANDBOX_SECURITY_LUA = getSandboxSecurityLua();
