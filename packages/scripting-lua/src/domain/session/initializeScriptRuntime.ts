import type { LuaEngine } from 'wasmoon';
import type {
  SubsystemPortRegistry,
  SubsystemRuntimeState,
  ScriptSchema,
  SceneState,
  SceneEventBus,
  SceneEventBusProviderPort,
} from '@duckengine/core-v2';
import {
  resolveRuntimeBridgeTable,
  ENGINE_SYSTEM_BRIDGES,
  inputBridge,
  gizmoBridge,
  physicsBridge,
  createTimeBridgeDeclaration,
  type BridgePorts,
} from '../bridges';
import { createDefaultScriptingBridges } from '../subsystems/defaultBridges';
import { createScriptingSession, type ScriptingSessionState } from './index';
import type { ScriptSandbox } from '../ports';

export interface ScriptRuntimeOptions {
    readonly sandbox: ScriptSandbox;
    readonly engine: LuaEngine;
    readonly registry: SubsystemPortRegistry;
    readonly bridgePorts: BridgePorts;
    readonly runtimeState: SubsystemRuntimeState;
    readonly eventBus: SceneEventBus;
    readonly sceneId: import('@duckengine/core-v2').SceneId;
    readonly sceneEventBusProvider?: SceneEventBusProviderPort;
    readonly onSandboxReady?: (params: { lua: LuaEngine; ports: SubsystemPortRegistry }) => void;
    readonly resolveSource?: (scriptId: string) => Promise<string | null>;
    readonly resolveScriptSchema?: (scriptId: string) => Promise<ScriptSchema | null>;
}

/**
 * Orchestrates the domain-level initialization of the Lua runtime.
 * Injects ports, runs developer hooks, and creates the session state.
 */
export function initializeScriptRuntime(options: ScriptRuntimeOptions): ScriptingSessionState {
    const {
        engine,
        runtimeState,
        registry,
        onSandboxReady,
        sandbox,
        bridgePorts,
        eventBus,
        sceneId,
        sceneEventBusProvider,
    } = options;

    // 1. Auto-bridge dynamically registered ports
    const scriptPorts = resolveRuntimeBridgeTable(runtimeState);
    engine.global.set('engine_ports', scriptPorts);

    // 2. Notify outer layer (infrastructure/config) that sandbox is ready for manual bridge injection
    if (onSandboxReady) {
        onSandboxReady({ lua: engine, ports: registry });
    }

    // 3. Create standard bridges and time/event infrastructure (eventBus from provider)
    const { bridges, timeState } = createDefaultScriptingBridges(eventBus);

    // 4. Inject Engine global (Input, Gizmo, Physics, Time) — system ports live here, not on self
    const Engine: Record<string, unknown> = {};
    const engineBridges = [
      { name: 'Input', decl: inputBridge },
      { name: 'Gizmo', decl: gizmoBridge },
      { name: 'Physics', decl: physicsBridge },
      { name: 'Time', decl: createTimeBridgeDeclaration(timeState) },
    ];
    for (const { name, decl } of engineBridges) {
      if (ENGINE_SYSTEM_BRIDGES.has(name)) {
        Engine[name] = decl.factory(
          null as unknown as SceneState,
          '',
          null,
          bridgePorts,
          undefined,
        );
      }
    }
    engine.global.set('Engine', Engine);

    // 5. Return the fully initialized session state
    return createScriptingSession({
        sandbox,
        bridges,
        ports: bridgePorts,
        eventBus,
        timeState,
        sceneId,
        sceneEventBusProvider,
        resolveSource: options.resolveSource,
        resolveScriptSchema: options.resolveScriptSchema,
    });
}
