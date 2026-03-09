import type { LuaEngine } from 'wasmoon';
import type { SubsystemPortRegistry, SubsystemRuntimeState, ScriptSchema } from '@duckengine/core-v2';
import { resolveRuntimeBridgeTable, type BridgePorts } from '../bridges';
import { createDefaultScriptingBridges } from '../subsystems/defaultBridges';
import { createScriptingSession, type ScriptingSessionState } from './index';
import type { ScriptSandbox } from '../ports';

export interface ScriptRuntimeOptions {
    readonly sandbox: ScriptSandbox;
    readonly engine: LuaEngine;
    readonly registry: SubsystemPortRegistry;
    readonly bridgePorts: BridgePorts;
    readonly runtimeState: SubsystemRuntimeState;
    readonly onSandboxReady?: (params: { lua: LuaEngine; ports: SubsystemPortRegistry }) => void;
    readonly resolveSource?: (scriptId: string) => Promise<string | null>;
    readonly resolveScriptSchema?: (scriptId: string) => Promise<ScriptSchema | null>;
}

/**
 * Orchestrates the domain-level initialization of the Lua runtime.
 * Injects ports, runs developer hooks, and creates the session state.
 */
export function initializeScriptRuntime(options: ScriptRuntimeOptions): ScriptingSessionState {
    const { engine, runtimeState, registry, onSandboxReady, sandbox, bridgePorts } = options;

    // 1. Auto-bridge dynamically registered ports
    const scriptPorts = resolveRuntimeBridgeTable(runtimeState);
    engine.global.set('engine_ports', scriptPorts);

    // 2. Notify outer layer (infrastructure/config) that sandbox is ready for manual bridge injection
    if (onSandboxReady) {
        onSandboxReady({ lua: engine, ports: registry });
    }

    // 3. Create standard bridges and time/event infrastructure
    const { bridges, eventBus, timeState } = createDefaultScriptingBridges();

    // 4. Return the fully initialized session state
    return createScriptingSession({
        sandbox,
        bridges,
        ports: bridgePorts,
        eventBus,
        timeState,
        resolveSource: options.resolveSource,
        resolveScriptSchema: options.resolveScriptSchema,
    });
}
