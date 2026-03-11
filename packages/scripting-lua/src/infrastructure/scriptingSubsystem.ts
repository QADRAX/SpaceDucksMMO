import {
  defineSceneSubsystem,
  ResourceLoaderPortDef,
  DiagnosticPortDef,
  SceneEventBusProviderPortDef,
} from '@duckengine/core-v2';
import { resolveBridgePortsFromRegistry } from '../domain/bridges';
import type { LuaEngine } from 'wasmoon';
import { initializeScriptRuntime } from '../domain/session';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createBuiltInScriptSchemaResolver } from './createBuiltInScriptSchemaResolver';
import { createResourceScriptResolver } from './resourceScriptResolver';
import { createWasmoonSandbox } from './wasmoon';

import type { SubsystemPortRegistry, DiagnosticPort } from '@duckengine/core-v2';

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

  /**
   * Optional diagnostic port for bootstrap errors (e.g. wasmoon boot failure).
   * When not provided, bootstrap errors are rethrown without logging.
   */
  readonly diagnostic?: DiagnosticPort;
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
    config?.diagnostic?.log('warn', 'Failed to boot wasmoon', { error: String(err) });
    throw err;
  });

  return defineSceneSubsystem('scripting-lua')
    // 1. Resolve external ports from the registry
    .withPorts((registry) => ({
      registry,
      bridgePorts: resolveBridgePortsFromRegistry(registry),
      resourceLoader: registry.get(ResourceLoaderPortDef),
      diagnostic: registry.get(DiagnosticPortDef),
      sceneEventBusProvider: registry.get(SceneEventBusProviderPortDef),
    }))

    // 2. Initialize internal state (the scripting session)
    .withState(({
      ports: { bridgePorts, registry, resourceLoader, diagnostic, sceneEventBusProvider },
      scene,
      engine: engineState,
    }) => {
      const resolver = resourceLoader
        ? createResourceScriptResolver(resourceLoader, createBuiltInScriptResolver(), diagnostic)
        : { resolveSource: createBuiltInScriptResolver() };

      if (sandbox.bindDiagnostic) {
        sandbox.bindDiagnostic(diagnostic);
      }

      const eventBus = sceneEventBusProvider?.getOrCreateEventBus(scene.id);
      if (!eventBus) {
        throw new Error(
          'SceneEventBusProviderPort required for scripting. Ensure setupEngine runs (deriveSceneEventBusProvider is automatic).',
        );
      }

      return initializeScriptRuntime({
        sandbox,
        engine,
        registry,
        bridgePorts,
        runtimeState: engineState.subsystemRuntime,
        onSandboxReady: config?.onSandboxReady,
        resolveSource: (id) => resolver.resolveSource(id),
        resolveScriptSchema: createBuiltInScriptSchemaResolver(),
        eventBus,
        sceneId: scene.id,
        sceneEventBusProvider,
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
