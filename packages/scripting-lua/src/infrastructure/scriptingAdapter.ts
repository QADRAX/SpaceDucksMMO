import type {
  SceneState,
  SceneChangeEventWithError,
  SceneSystemAdapter,
  EngineState,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, TimeState } from '../domain/bridges';
import type { ScriptSandbox } from '../domain/ports';
import { createScriptEventBus } from '../domain/events';
import { createScriptingSession } from '../domain/session';
import { bindScriptingUseCase } from '../domain/useCases';
import { reconcileSlots } from '../application/reconcileSlots';
import { destroyEntitySlots } from '../application/destroyEntitySlots';
import { runFrameHooks } from '../application/runFrameHooks';
import { teardownSession } from '../application/teardownSession';

/** Configuration for creating a scripting adapter. */
export interface CreateScriptingAdapterParams {
  /** The root engine state (for cross-scene resolution). */
  readonly engine: EngineState;
  /** The scene this adapter manages. */
  readonly sceneId: string;
  /** Bridge declarations to install per slot. */
  readonly bridges: ReadonlyArray<BridgeDeclaration>;
  /** External ports for bridges that need infra (physics, input, gizmo). */
  readonly ports?: BridgePorts;
  /** The sandbox implementation (wasmoon or mock). */
  readonly sandbox: ScriptSandbox;
  /** Shared time state updated by the adapter each frame. */
  readonly timeState: TimeState;
  /** Optional script source resolver. Defaults to no-op. */
  readonly resolveSource?: (scriptId: string) => Promise<string | null>;
}

/**
 * Creates a `SceneSystemAdapter` that manages Lua script lifecycles.
 *
 * This is a thin composition root that delegates all business logic
 * to application-layer use cases. It owns the ScriptingSessionState
 * and routes SceneChangeEvents to the appropriate use case.
 */
export function createScriptingAdapter(
  params: CreateScriptingAdapterParams,
): SceneSystemAdapter {
  const { engine: _engine, sceneId: _sceneId, bridges, ports, sandbox, timeState } = params;

  const session = createScriptingSession({
    sandbox,
    bridges,
    ports,
    eventBus: createScriptEventBus(),
    timeState,
    resolveSource: params.resolveSource,
  });

  const boundReconcile = bindScriptingUseCase(session, reconcileSlots);
  const boundDestroy = bindScriptingUseCase(session, destroyEntitySlots);
  const boundRunFrame = bindScriptingUseCase(session, runFrameHooks);
  const boundTeardown = bindScriptingUseCase(session, teardownSession);

  return {
    handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void {
      if (event.kind === 'component-changed' && event.componentType === 'script') {
        boundReconcile.execute({ scene, entityId: event.entityId });
      }

      if (event.kind === 'entity-removed') {
        boundDestroy.execute({ entityId: event.entityId });
      }

      if (event.kind === 'scene-teardown') {
        boundTeardown.execute(undefined as void);
      }
    },

    update(scene: SceneState, dt: number): void {
      boundRunFrame.execute({ scene, dt });
    },

    dispose(): void {
      boundTeardown.execute(undefined as void);
      sandbox.dispose();
    },
  };
}
