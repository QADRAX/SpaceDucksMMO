import type { ComponentBase } from '../core';

/** Reference to an attached script with per-instance configuration. */
export interface ScriptReference {
    scriptId: string;
    enabled: boolean;
    properties: Record<string, unknown>;
}

/** Script container component. Array order defines execution order. */
export interface ScriptComponent extends ComponentBase<'script', ScriptComponent> {
    scripts: ScriptReference[];
}
