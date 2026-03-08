import type { SceneState, SceneChangeEventWithError, SceneSystemAdapter } from '../scene';
import type { AdapterUseCase } from '../useCases';

/**
 * Params passed to adapter use cases during the `update` lifecycle hook.
 */
export interface AdapterUpdateParams {
  readonly scene: SceneState;
  readonly dt: number;
}

/**
 * Params passed to adapter use cases during the `handleSceneEvent` lifecycle hook.
 */
export interface AdapterEventParams {
  readonly scene: SceneState;
  readonly event: SceneChangeEventWithError;
}

/**
 * Fluent builder for composing a SceneSystemAdapter from adapter use cases.
 *
 * Adapters (physics, scripting, rendering) encapsulate subsystem state and
 * participate in the scene lifecycle via three hooks:
 *
 * - `handleSceneEvent`: React to scene changes (reactive channel).
 * - `update`: Advance one frame tick (synchronous pipeline).
 * - `dispose`: Release resources when the adapter is detached.
 *
 * This builder binds adapter use cases to those lifecycle hooks, eliminating
 * manual binding boilerplate and providing a declarative, fluent API.
 *
 * @template TState - The adapter's internal state (e.g. ScriptingSessionState).
 *
 * @example
 * ```ts
 * export function createScriptingAdapter(params: CreateScriptingAdapterParams) {
 *   const session = createScriptingSession({...});
 *
 *   return composeAdapter(session)
 *     .on('component-changed', reconcileSlots)
 *     .on('entity-removed', destroyEntitySlots)
 *     .on('scene-teardown', teardownSession)
 *     .onUpdate(runFrameHooks)
 *     .onDispose(teardownSession)
 *     .updateWhenPaused(false)
 *     .build();
 * }
 * ```
 */
export interface AdapterComposer<TState> {
  /**
   * Register a use case to handle a specific scene event kind.
   *
   * Multiple use cases can be registered for the same event kind;
   * they will execute in registration order.
   *
   * @param eventKind - The scene event kind to listen for.
   * @param useCase - The use case to execute when the event fires.
   */
  on<K extends SceneChangeEventWithError['kind']>(
    eventKind: K,
    useCase: AdapterUseCase<TState, AdapterEventParams, void>,
  ): this;

  /**
   * Register the frame update use case.
   *
   * Called once per frame with the scene state and delta time.
   * Only one update use case can be registered.
   *
   * @param useCase - The use case to execute on each frame.
   */
  onUpdate(useCase: AdapterUseCase<TState, AdapterUpdateParams, void>): this;

  /**
   * Register the disposal use case.
   *
   * Called when the adapter is detached from the scene or the scene is torn down.
   * Only one dispose use case can be registered.
   *
   * @param useCase - The use case to execute during disposal.
   */
  onDispose(useCase: AdapterUseCase<TState, void, void>): this;

  /**
   * Set whether the adapter's `update` should run when the scene is paused.
   *
   * Defaults to `false`.
   *
   * @param enabled - If true, `update` runs even when the scene is paused.
   */
  updateWhenPaused(enabled: boolean): this;

  /**
   * Build the final SceneSystemAdapter.
   *
   * Returns a frozen adapter object that participates in the scene lifecycle.
   */
  build(): SceneSystemAdapter;
}

/**
 * Creates a composable adapter builder bound to an adapter's state.
 *
 * Use this to declare a SceneSystemAdapter from use cases instead of
 * manually binding them in infrastructure code.
 *
 * @param state - The adapter's internal state.
 * @returns A new adapter composer instance.
 *
 * @example
 * ```ts
 * const session = createScriptingSession({...});
 *
 * return composeAdapter(session)
 *   .on('component-changed', reconcileSlots)
 *   .on('entity-removed', destroyEntitySlots)
 *   .onUpdate(runFrameHooks)
 *   .onDispose(teardownSession)
 *   .build();
 * ```
 */
export function composeAdapter<TState>(state: TState): AdapterComposer<TState> {
  const eventHandlers = new Map<
    SceneChangeEventWithError['kind'],
    Array<AdapterUseCase<TState, AdapterEventParams, void>>
  >();
  let updateUseCase: AdapterUseCase<TState, AdapterUpdateParams, void> | undefined;
  let disposeUseCase: AdapterUseCase<TState, void, void> | undefined;
  let shouldUpdateWhenPaused = false;

  const composer: AdapterComposer<TState> = {
    on(eventKind, useCase) {
      const handlers = eventHandlers.get(eventKind) ?? [];
      handlers.push(useCase);
      eventHandlers.set(eventKind, handlers);
      return composer;
    },

    onUpdate(useCase) {
      updateUseCase = useCase;
      return composer;
    },

    onDispose(useCase) {
      disposeUseCase = useCase;
      return composer;
    },

    updateWhenPaused(enabled) {
      shouldUpdateWhenPaused = enabled;
      return composer;
    },

    build(): SceneSystemAdapter {
      return {
        handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void {
          const handlers = eventHandlers.get(event.kind);
          if (handlers) {
            for (const handler of handlers) {
              handler.execute(state, { scene, event });
            }
          }
        },

        update: updateUseCase
          ? (scene: SceneState, dt: number) => {
              updateUseCase!.execute(state, { scene, dt });
            }
          : undefined,

        updateWhenPaused: shouldUpdateWhenPaused,

        dispose: disposeUseCase
          ? () => {
              disposeUseCase!.execute(state, undefined as void);
            }
          : undefined,
      };
    },
  };

  return composer;
}
