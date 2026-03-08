import type { ScriptSchema } from '@duckengine/core-v2';
import {
  createSceneBridgeDeclaration,
  createTimeBridgeDeclaration,
  createTimeState,
  gizmoBridge,
  inputBridge,
  physicsBridge,
  transformBridge,
} from '../bridges';
import type { BridgePorts } from '../bridges';
import { createScriptEventBus } from '../events';
import { createScriptingSession } from '../session';
import type { ScriptingSessionState } from '../session';
import type { ScriptSandbox } from '../ports';

export interface CreateScriptingRuntimeParams {
  readonly sandbox: ScriptSandbox;
  readonly ports?: BridgePorts;
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
  readonly resolveScriptSchema?: (scriptId: string) => Promise<ScriptSchema | null>;
}

/**
 * Creates a scripting session with the default bridge topology.
 */
export function createScriptingRuntime(
  params: CreateScriptingRuntimeParams,
): ScriptingSessionState {
  const eventBus = createScriptEventBus();
  const timeState = createTimeState();

  const bridges = [
    transformBridge,
    createSceneBridgeDeclaration(eventBus),
    physicsBridge,
    inputBridge,
    createTimeBridgeDeclaration(timeState),
    gizmoBridge,
  ];

  return createScriptingSession({
    sandbox: params.sandbox,
    bridges,
    ports: params.ports,
    eventBus,
    timeState,
    resolveSource: params.resolveSource,
    resolveScriptSchema: params.resolveScriptSchema,
  });
}
