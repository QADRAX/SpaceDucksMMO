import type { ScriptSchema, SceneEventBus, SceneEventBusProviderPort, SceneId } from '@duckengine/core-v2';
import type { ScriptingSessionState } from './types';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../bridges';
import type { ScriptSandbox } from '../ports';

/** Parameters for creating a new scripting session. */
export interface CreateScriptingSessionParams {
  readonly sandbox: ScriptSandbox;
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  readonly ports?: BridgePorts;
  readonly eventBus: SceneEventBus;
  readonly timeState: TimeState;
  readonly sceneId?: SceneId;
  readonly sceneEventBusProvider?: SceneEventBusProviderPort;
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
  readonly resolveScriptSchema?: (scriptId: string) => Promise<ScriptSchema | null>;
}

/** Creates a fresh ScriptingSessionState with empty slot maps. */
export function createScriptingSession(
  params: CreateScriptingSessionParams,
): ScriptingSessionState {
  return {
    slots: new Map(),
    pending: new Map(),
    pendingScripts: [],
    eventBus: params.eventBus,
    timeState: params.timeState,
    sandbox: params.sandbox,
    bridges: params.bridges,
    ports: params.ports ?? {},
    sceneId: params.sceneId,
    sceneEventBusProvider: params.sceneEventBusProvider,
    resolveSource: params.resolveSource ?? (() => Promise.resolve(null)),
    resolveScriptSchema: params.resolveScriptSchema ?? (() => Promise.resolve(null)),
    pendingDestroys: [],
  };
}
