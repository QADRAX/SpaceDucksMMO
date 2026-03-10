import type { ScriptHook } from './types';

/**
 * All valid lifecycle hook names.
 * Used for fast lookup when parsing script source.
 */
export const ALL_HOOKS: ReadonlySet<string> = new Set<ScriptHook>([
    'init',
    'onEnable',
    'earlyUpdate',
    'update',
    'lateUpdate',
    'onDrawGizmos',
    'onCollisionEnter',
    'onCollisionExit',
    'onPropertyChanged',
    'onDisable',
    'onDestroy',
]);

/**
 * Statically detects which lifecycle hooks a Lua script source declares.
 *
 * Matches two common patterns:
 * - `function hookName(`    top-level function declaration
 * - `hookName = function(`  table-field or variable assignment
 *
 * This is a lightweight regex scan — no Lua parsing required.
 * Scripts that dynamically assign hooks at runtime will not be detected.
 *
 * @param source - Raw Lua source string.
 * @returns Array of hook names found in the source (order of appearance).
 */
export function detectHooksFromSource(source: string): ScriptHook[] {
    const found: ScriptHook[] = [];
    const pattern = /\bfunction\s+(?:[\w.]+[.:])?(\w+)\s*\(|(\w+)\s*=\s*function\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
        const name = match[1] ?? match[2];
        if (name && ALL_HOOKS.has(name)) {
            found.push(name as ScriptHook);
        }
    }
    return found;
}
