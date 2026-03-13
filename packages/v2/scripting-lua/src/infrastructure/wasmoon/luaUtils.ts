import type { LuaEngine } from 'wasmoon';

/**
 * Calls a named Lua global function with the given arguments.
 *
 * Returns the value returned by Lua, or undefined if the global is not a function.
 * Does not catch Lua errors — callers should wrap in try/catch if needed.
 *
 * @param lua  - Active Lua engine.
 * @param name - Name of the Lua global function.
 * @param args - Arguments forwarded to the Lua function.
 */
export function callLuaGlobal(lua: LuaEngine, name: string, ...args: unknown[]): unknown {
    const fn = lua.global.get(name) as ((...a: unknown[]) => unknown) | undefined;
    if (typeof fn !== 'function') return undefined;
    return fn(...args);
}
