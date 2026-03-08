import type { ScriptingSessionState } from './types';
import type { ScriptEventBus } from '../events';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../bridges';
import type { ScriptSandbox } from '../ports';

/** Parameters for creating a new scripting session. */
export interface CreateScriptingSessionParams {
  readonly sandbox: ScriptSandbox;
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  readonly ports?: BridgePorts;
  readonly eventBus: ScriptEventBus;
  readonly timeState: TimeState;
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
}

/** Creates a fresh ScriptingSessionState with empty slot maps. */
export function createScriptingSession(
  params: CreateScriptingSessionParams,
): ScriptingSessionState {
  return {
    slots: new Map(),
    pending: new Map(),
    eventBus: params.eventBus,
    timeState: params.timeState,
    sandbox: params.sandbox,
    bridges: params.bridges,
    ports: params.ports ?? {},
    resolveSource: params.resolveSource ?? (() => Promise.resolve(null)),
  };
}
