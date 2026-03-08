import type { SceneState, SceneChangeEventWithError } from '../scene';
import type { AdapterUseCase } from '../useCases';
import type { SceneSystemAdapter } from './types';

/** Params passed to adapter use cases during the `update` lifecycle hook. */
export interface AdapterUpdateParams {
  readonly scene: SceneState;
  readonly dt: number;
}

/** Params passed to adapter use cases during `handleSceneEvent`. */
export interface AdapterEventParams {
  readonly scene: SceneState;
  readonly event: SceneChangeEventWithError;
}

/** Fluent builder for composing a SceneSystemAdapter from adapter use cases. */
export interface AdapterComposer<TState> {
  on<K extends SceneChangeEventWithError['kind']>(
    eventKind: K,
    useCase: AdapterUseCase<TState, AdapterEventParams, void>,
  ): this;
  onUpdate(useCase: AdapterUseCase<TState, AdapterUpdateParams, void>): this;
  onDispose(useCase: AdapterUseCase<TState, void, void>): this;
  updateWhenPaused(enabled: boolean): this;
  build(): SceneSystemAdapter;
}

/** Creates a composable adapter builder bound to an adapter's state. */
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
          if (!handlers) return;
          for (const handler of handlers) {
            handler.execute(state, { scene, event });
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
