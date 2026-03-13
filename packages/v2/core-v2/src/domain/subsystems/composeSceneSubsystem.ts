import type { SceneState, SceneChangeEventWithError } from '../scene';
import type { SubsystemUseCase } from '../useCases';
import type { SceneSubsystem, SubsystemUpdateParams, SubsystemEventParams, SubsystemComposer } from './types';

type PhaseUseCase = SubsystemUseCase<unknown, SubsystemUpdateParams, void>;

function makePhaseCallback(
  useCase: PhaseUseCase | undefined,
  state: unknown,
): ((scene: SceneState, dt: number) => void) | undefined {
  if (!useCase) return undefined;
  return (scene: SceneState, dt: number) => {
    (useCase as SubsystemUseCase<unknown, SubsystemUpdateParams, void>).execute(state, { scene, dt });
  };
}

/** Creates a composable subsystem builder bound to a subsystem's state. */
export function composeSceneSubsystem<TState>(state: TState): SubsystemComposer<TState> {
  const eventHandlers = new Map<
    SceneChangeEventWithError['kind'],
    Array<SubsystemUseCase<TState, SubsystemEventParams, void>>
  >();
  const phaseUseCases: Partial<Record<'earlyUpdate' | 'physics' | 'update' | 'lateUpdate' | 'preRender' | 'postRender', PhaseUseCase>> = {};
  let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
  let shouldUpdateWhenPaused = false;

  const composer: SubsystemComposer<TState> = {
    on(eventKind, useCase) {
      const handlers = eventHandlers.get(eventKind) ?? [];
      handlers.push(useCase);
      eventHandlers.set(eventKind, handlers);
      return composer;
    },

    onEarlyUpdate(useCase) {
      phaseUseCases.earlyUpdate = useCase as PhaseUseCase;
      return composer;
    },
    onPhysics(useCase) {
      phaseUseCases.physics = useCase as PhaseUseCase;
      return composer;
    },
    onUpdate(useCase) {
      phaseUseCases.update = useCase as PhaseUseCase;
      return composer;
    },
    onLateUpdate(useCase) {
      phaseUseCases.lateUpdate = useCase as PhaseUseCase;
      return composer;
    },
    onPreRender(useCase) {
      phaseUseCases.preRender = useCase as PhaseUseCase;
      return composer;
    },
    onPostRender(useCase) {
      phaseUseCases.postRender = useCase as PhaseUseCase;
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

        earlyUpdate: makePhaseCallback(phaseUseCases.earlyUpdate, state),
        physics: makePhaseCallback(phaseUseCases.physics, state),
        update: makePhaseCallback(phaseUseCases.update, state),
        lateUpdate: makePhaseCallback(phaseUseCases.lateUpdate, state),
        preRender: makePhaseCallback(phaseUseCases.preRender, state),
        postRender: makePhaseCallback(phaseUseCases.postRender, state),

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
