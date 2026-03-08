import type { SceneSystemAdapter, ScriptSchema } from '@duckengine/core-v2';
import { composeAdapter } from '@duckengine/core-v2';
import type { BridgePorts } from '../domain/bridges';
import {
  transformBridge,
  createSceneBridgeDeclaration,
  physicsBridge,
  inputBridge,
  createTimeBridgeDeclaration,
  createTimeState,
  gizmoBridge,
} from '../domain/bridges';
import type { ScriptSandbox } from '../domain/ports';
import { createScriptEventBus } from '../domain/events';
import { createScriptingSession } from '../domain/session';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';
import { createBuiltInScriptResolver } from './createBuiltInScriptResolver';

function createDefaultSandbox(): ScriptSandbox {
  // Temporary infra-owned sandbox used until wasmoon runtime is implemented.
  return {
    detectHooks(_source: string) {
      return [];
    },
    createSlot() {
      // no-op
    },
    destroySlot() {
      // no-op
    },
    callHook() {
      return true;
    },
    syncProperties() {
      // no-op
    },
    flushDirtyProperties() {
      return null;
    },
    dispose() {
      // no-op
    },
  };
}

/**
 * Configuration for creating a scripting adapter.
 *
 * Infrastructure layer: receives only external dependencies and composes
 * the concrete bridges, sandbox, and session internally.
 */
export interface CreateScriptingAdapterParams {
  /** External ports for bridges that need infra (physics, input, gizmo). */
  readonly ports?: BridgePorts;
  /** Optional script source resolver. Defaults to built-in resolver. */
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
  /** Optional script schema resolver. Defaults to no-op. */
  readonly resolveScriptSchema?: (scriptId: string) => Promise<ScriptSchema | null>;
}

/**
 * Creates a `SceneSystemAdapter` that manages Lua script lifecycles.
 *
 * Uses the `composeAdapter` builder to declaratively bind use cases
 * to the scene lifecycle hooks. All business logic lives in application-layer
 * use cases; this is a thin composition root.
 *
 * The adapter receives runtime state (scene, delta time) via its lifecycle
 * methods (`handleSceneEvent`, `update`) — not at construction time.
 */
export function createScriptingAdapter(
  params: CreateScriptingAdapterParams,
): SceneSystemAdapter {
  const { ports } = params;

  // Create shared state and event bus
  const eventBus = createScriptEventBus();
  const timeState = createTimeState();

  // Compose concrete bridges (infrastructure responsibility)
  const bridges = [
    transformBridge,
    createSceneBridgeDeclaration(eventBus),
    physicsBridge,
    inputBridge,
    createTimeBridgeDeclaration(timeState),
    gizmoBridge,
  ];

  const session = createScriptingSession({
    sandbox: createDefaultSandbox(),
    bridges,
    ports,
    eventBus,
    timeState,
    resolveSource: params.resolveSource ?? createBuiltInScriptResolver(),
    resolveScriptSchema: params.resolveScriptSchema,
  });

  return composeAdapter(session)
    .on('component-changed', reconcileSlots)
    .on('entity-removed', destroyEntitySlots)
    .on('scene-teardown', teardownSession)
    .onUpdate(runFrameHooks)
    .onDispose(teardownSession)
    .build();
}
