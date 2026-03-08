import { defineSceneSubsystem } from '@duckengine/core-v2';
import { resolveBridgePortsFromRegistry, type BridgePorts } from '../domain/bridges';
import { createMutableScriptSandbox, createNoopScriptSandbox } from '../domain/ports';
import { createScriptingSession } from '../domain/session';
import { createDefaultScriptingBridges } from '../domain/subsystems';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createWasmoonSandbox } from './wasmoon';

/**
 * Scene subsystem factory for Lua scripting.
 * 
 * Uses the normalized `defineSceneSubsystem` builder to wire ports, session state,
 * and lifecycle use cases in a single declarative block.
 */
export const scriptingLuaSubsystem = defineSceneSubsystem('scripting-lua')
  // 1. Resolve external ports from the registry
  .withPorts((registry: any): BridgePorts => resolveBridgePortsFromRegistry(registry))

  // 2. Initialize internal state (the scripting session)
  .withState(({ ports }: any) => {
    const sandbox = createMutableScriptSandbox(createNoopScriptSandbox());

    // Boot real wasmoon engine asynchronously
    void createWasmoonSandbox()
      .then((lua) => sandbox.setTarget(lua))
      .catch((err) => {
        console.warn('[scripting-lua] Failed to boot wasmoon, using noop.', err);
      });

    const { bridges, eventBus, timeState } = createDefaultScriptingBridges();

    return createScriptingSession({
      sandbox: sandbox.sandbox,
      bridges,
      ports,
      eventBus,
      timeState,
      resolveSource: createBuiltInScriptResolver(),
    });
  })

  // 3. Register lifecycle use cases (auto-routed by event.kind)
  .onEvent(reconcileSlots)
  .onEvent(destroyEntitySlots)
  .onEvent(teardownSession)
  .onUpdate(runFrameHooks)
  .onDispose(teardownSession)

  .build();
