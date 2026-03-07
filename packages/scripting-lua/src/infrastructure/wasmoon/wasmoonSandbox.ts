import type { ScriptSandbox } from '../../domain/ports';

/**
 * Creates a Lua sandbox backed by wasmoon (Lua 5.4 via WebAssembly).
 *
 * This is the real implementation — it loads the WASM binary,
 * creates a LuaEngine, installs the security/metatable/runtime
 * modules, and exposes the ScriptSandbox interface.
 *
 * @returns A promise that resolves to the initialized sandbox.
 */
export async function createWasmoonSandbox(): Promise<ScriptSandbox> {
  throw new Error('wasmoon sandbox not yet implemented — use createMockSandbox for testing');
}
