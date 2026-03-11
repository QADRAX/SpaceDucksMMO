// Legacy exports for backward compatibility
export { SANDBOX_SECURITY_LUA } from './sandboxSecurity';
export { SANDBOX_METATABLES_LUA } from './sandboxMetatables';
export { SANDBOX_RUNTIME_LUA } from './sandboxRuntime';
export { MATH_EXT_LUA } from './mathExt';

// New getter functions that load from generated assets
export {
  getSandboxSecurityLua,
} from './sandboxSecurity';

export {
  getBuiltinScriptsLua,
} from './builtinScripts';

export {
  getSandboxRuntimeLua,
} from './sandboxRuntime';

export {
  getSandboxMetatablesLua,
} from './sandboxMetatables';

export {
  getMathExtLua,
} from './mathExt';

// Re-export generated scripts for external use
export { SystemScripts, BuiltInScripts } from '../generated/ScriptAssets';
