import { defineSceneSubsystem, ResourceLoaderPortDef } from '@duckengine/core-v2';
import { resolveBridgePortsFromRegistry } from '../domain/bridges';
import type { LuaEngine } from 'wasmoon';
import { initializeScriptRuntime } from '../domain/session';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createResourceScriptResolver } from './resourceScriptResolver';
import { createWasmoonSandbox } from './wasmoon';

import type { SubsystemPortRegistry } from '@duckengine/core-v2';

export interface ScriptingSubsystemConfig {
  /**
   * Hook for games to inject custom Lua bridges.
   * Runs right after the built-in Sandbox and standard bridges are created.
   *
   * @param params.lua The underlying Wasmoon Lua instance.
   * @param params.ports The populated engine port registry.
   */
  readonly onSandboxReady?: (params: {
    lua: LuaEngine;
    ports: SubsystemPortRegistry;
  }) => void;
}

/**
 * Creates the scene subsystem factory for Lua scripting.
 *
 * Uses the normalized `defineSceneSubsystem` builder to wire ports, session state,
 * and lifecycle use cases in a single declarative block. Allows configuring
 * hooks to inject custom bridges.
 */
export async function createScriptingSubsystem(config?: ScriptingSubsystemConfig) {
  // Boot real wasmoon engine asynchronously before defining the subsystem
  const { sandbox, engine } = await createWasmoonSandbox().catch((err) => {
    console.warn('[scripting-lua] Failed to boot wasmoon.', err);
    throw err;
  });

  return defineSceneSubsystem('scripting-lua')
    // 1. Resolve external ports from the registry
    .withPorts((registry) => ({
      registry,
      bridgePorts: resolveBridgePortsFromRegistry(registry),
      resourceLoader: registry.get(ResourceLoaderPortDef),
    }))

    // 2. Initialize internal state (the scripting session)
    .withState(({ ports: { bridgePorts, registry, resourceLoader }, engine: engineState }) => {
      const resolver = resourceLoader
        ? createResourceScriptResolver(resourceLoader, createBuiltInScriptResolver())
        : { resolveSource: createBuiltInScriptResolver() };

      return initializeScriptRuntime({
        sandbox,
        engine,
        registry,
        bridgePorts,
        runtimeState: engineState.subsystemRuntime,
        onSandboxReady: config?.onSandboxReady,
        resolveSource: (id) => resolver.resolveSource(id),
      });
    })

    // 3. Register lifecycle use cases (auto-routed by event.kind)
    .onEvent(reconcileSlots)
    .onEvent(destroyEntitySlots)
    .onEvent(teardownSession)
    .onUpdate(runFrameHooks)
    .onDispose(teardownSession)

    .build();
}
