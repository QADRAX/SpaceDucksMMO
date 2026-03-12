import type { LuaEngine } from 'wasmoon';
import type { SceneSubsystemFactoryContext, ScriptSchema } from '@duckengine/core-v2';
import { SceneEventBusProviderPortDef } from '@duckengine/core-v2';
import { resolveBridgePortsFromRegistry } from '../bridges';
import { initializeScriptRuntime } from './initializeScriptRuntime';
import type { ScriptingSessionState } from './index';
import type { ScriptSandbox } from '../ports';

/** Parameters provided by infrastructure when creating script runtime from context. */
export interface CreateScriptRuntimeParams {
  readonly sandbox: ScriptSandbox;
  readonly engine: LuaEngine;
  readonly resolveSource: (scriptId: string) => Promise<string | null>;
  readonly resolveScriptSchema: (scriptId: string) => Promise<ScriptSchema | null>;
}

/**
 * Creates a scripting session from the scene subsystem factory context.
 *
 * Resolves ports from the registry and delegates to initializeScriptRuntime.
 * SceneEventBusProvider is always present (default port derivers register it).
 *
 * @param ctx - Context from createSceneSubsystem (engine, scene, ports).
 * @param params - Sandbox, engine, and resolvers provided by infrastructure.
 */
export function createScriptRuntimeFromContext(
  ctx: SceneSubsystemFactoryContext,
  params: CreateScriptRuntimeParams,
): ScriptingSessionState {
  const bridgePorts = resolveBridgePortsFromRegistry(ctx.ports);
  const sceneEventBusProvider = ctx.ports.get(SceneEventBusProviderPortDef)!;
  const eventBus = sceneEventBusProvider.getOrCreateEventBus(ctx.scene.id);

  return initializeScriptRuntime({
    sandbox: params.sandbox,
    engine: params.engine,
    registry: ctx.ports,
    bridgePorts,
    runtimeState: ctx.engine.subsystemRuntime,
    eventBus,
    sceneId: ctx.scene.id,
    sceneEventBusProvider,
    resolveSource: params.resolveSource,
    resolveScriptSchema: params.resolveScriptSchema,
  });
}
