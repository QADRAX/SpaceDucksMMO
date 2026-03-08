import type {
  SceneAdapterFactory,
  SceneSystemAdapter,
} from '@duckengine/core-v2';
import type { BridgePorts } from '../domain/bridges';
import { composeScriptingSceneAdapter, createScriptingRuntime } from '../domain/adapter';
import { resolveBridgePortsFromRegistry } from '../domain/bridges';
import { createMutableScriptSandbox, createNoopScriptSandbox } from '../domain/ports';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';
import { createWasmoonSandbox } from './wasmoon';

/**
 * Scene adapter factory ready to plug into
 * `setupEngine({ sceneAdapters: [...] })`.
 */
export const scriptingLuaSceneAdapterFactory: SceneAdapterFactory = (context) =>
  createScriptingAdapterWithPorts(resolveBridgePortsFromRegistry(context.ports));

function createScriptingAdapterWithPorts(ports?: BridgePorts): SceneSystemAdapter {
  const baseSandbox = createNoopScriptSandbox();
  const mutableSandbox = createMutableScriptSandbox(baseSandbox);
  const sandboxFactory = createWasmoonSandbox;

  void sandboxFactory()
    .then((sandbox) => {
      mutableSandbox.setTarget(sandbox);
    })
    .catch((error) => {
      // Keep no-op sandbox active so adapter remains functional until runtime exists.
      console.warn('[scripting-lua] Unable to initialize wasmoon sandbox, using noop sandbox.', error);
    });

  const session = createScriptingRuntime({
    sandbox: mutableSandbox.sandbox,
    ports,
    resolveSource: createBuiltInScriptResolver(),
  });

  return composeScriptingSceneAdapter({
    session,
    reconcileSlots,
    destroyEntitySlots,
    runFrameHooks,
    teardownSession,
  });
}
