import type { SceneState, SceneChangeEventWithError } from '../scene';
import type { SubsystemUseCase } from '../useCases';
import type { SceneSubsystem } from './types';

/** Params passed to subsystem use cases during the `update` lifecycle hook. */
export interface SubsystemUpdateParams {
  readonly scene: SceneState;
  readonly dt: number;
}

/** Params passed to subsystem use cases during `handleSceneEvent`. */
export interface SubsystemEventParams {
  readonly scene: SceneState;
  readonly event: SceneChangeEventWithError;
}

/** Fluent builder for composing a SceneSubsystem from subsystem use cases. */
export interface SubsystemComposer<TState> {
  on<K extends SceneChangeEventWithError['kind']>(
    eventKind: K,
    useCase: SubsystemUseCase<TState, SubsystemEventParams, void>,
  ): this;
  onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onDispose(useCase: SubsystemUseCase<TState, void, void>): this;
  updateWhenPaused(enabled: boolean): this;
  build(): SceneSubsystem;
}

/** Creates a composable subsystem builder bound to a subsystem's state. */
export function composeSceneSubsystem<TState>(state: TState): SubsystemComposer<TState> {
  const eventHandlers = new Map<
    SceneChangeEventWithError['kind'],
    Array<SubsystemUseCase<TState, SubsystemEventParams, void>>
  >();
  let updateUseCase: SubsystemUseCase<TState, SubsystemUpdateParams, void> | undefined;
  let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
  let shouldUpdateWhenPaused = false;

  const composer: SubsystemComposer<TState> = {
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

    build(): SceneSubsystem {
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
