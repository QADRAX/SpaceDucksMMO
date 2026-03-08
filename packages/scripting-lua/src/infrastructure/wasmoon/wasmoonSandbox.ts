import type { ScriptSandbox } from '../../domain/ports';
import {
  SystemScripts,
  BuiltInScripts,
} from './modules';

/**
 * Creates a Lua sandbox backed by wasmoon (Lua 5.4 via WebAssembly).
 *
 * Integration flow:
 * 1. Load WASM binary and create LuaEngine
 * 2. Install system scripts in order:
 *    - sandbox_security.lua (remove dangerous globals)
 *    - sandbox_metatables.lua (define metatable chains)
 *    - sandbox_runtime.lua (load runtime helpers: __WrapSelf, __CallHook, etc.)
 *    - math_ext.lua (load Vec3 + math.ext utilities)
 * 3. Register bridge interfaces (Transform, Physics, Scene, Input, etc.)
 * 4. Create slot execution context (entities with scripts)
 * 5. Expose ScriptSandbox interface (executeHook, resolveSource, etc.)
 *
 * System scripts are fetched from generated assets:
 * - SystemScripts['sandbox_security']
 * - SystemScripts['sandbox_runtime']
 * - SystemScripts['sandbox_metatables']
 * - SystemScripts['math_ext']
 *
 * Built-in scripts are available via:
 * - BuiltInScripts['empty']
 * - BuiltInScripts['debug_logger']
 * - BuiltInScripts['spawn_emitter']
 * - BuiltInScripts['continuous_rotator']
 * - BuiltInScripts['physics_movement']
 *
 * @returns A promise that resolves to the initialized sandbox.
 */
export async function createWasmoonSandbox(): Promise<ScriptSandbox> {
  // TODO: Implement wasmoon integration
  console.log('[TODO] wasmoon sandbox not yet implemented');
  console.log('System scripts ready:', Object.keys(SystemScripts));
  console.log('Built-in scripts ready:', Object.keys(BuiltInScripts));
  throw new Error(
    'wasmoon sandbox not yet implemented — use createMockSandbox for testing'
  );
}
