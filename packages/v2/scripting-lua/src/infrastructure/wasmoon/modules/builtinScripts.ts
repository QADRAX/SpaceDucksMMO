import { SystemScripts } from '../generated/ScriptAssets';

/**
 * Gets the Lua built-in script ID constants.
 * Defines BuiltInScripts in Lua (source of truth). Not injected from TypeScript.
 */
export function getBuiltinScriptsLua(): string {
  return SystemScripts['builtin_scripts'] ?? '';
}
