import type { EngineState } from '../engine';
import type { SubsystemUseCase } from '../useCases';
import type {
  EngineSubsystem,
  EngineSubsystemBuilder,
  EngineSubsystemUpdateParams,
  SubsystemEngineEventParams,
} from './types';
import type { EngineChangeEvent } from '../engine/engineEvents';
import { createSubsystemPortRegistry } from './runtime';

type PhaseUseCase = SubsystemUseCase<unknown, EngineSubsystemUpdateParams, void>;

function makeEnginePhaseCallback<TState>(
  useCase: PhaseUseCase | undefined,
  stateRef: { current: TState | undefined },
  stateFactory: (ctx: { engine: EngineState }) => TState,
): ((engine: EngineState, dt: number) => void) | undefined {
  if (!useCase) return undefined;
  return (engine: EngineState, dt: number) => {
    if (!stateRef.current) stateRef.current = stateFactory({ engine });
    const ports = createSubsystemPortRegistry(
      engine.subsystemRuntime.ports,
      engine.subsystemRuntime.portDefinitions
    );
    (useCase as PhaseUseCase).execute(stateRef.current, { engine, dt, ports });
  };
}

/**
 * Creates a fluent builder to define an EngineSubsystem.
 *
 * @param _name - Unique name for the subsystem (used in logging/debugging).
 * @returns A builder to configure the engine-level subsystem.
 */
export function defineEngineSubsystem<TState>(
    _name: string,
): EngineSubsystemBuilder<TState> {
    let stateFactory: (ctx: { engine: EngineState }) => TState;
    const phaseUseCases: Partial<Record<'earlyUpdate' | 'physics' | 'update' | 'lateUpdate' | 'preRender' | 'render' | 'postRender', PhaseUseCase>> = {};
    const engineEventUseCases = new Map<
        EngineChangeEvent['kind'],
        SubsystemUseCase<TState, SubsystemEngineEventParams, void>
    >();
    let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
    let shouldUpdateWhenPaused = false;

    const builder: EngineSubsystemBuilder<TState> = {
        withState(factory) {
            stateFactory = factory;
            return builder;
        },

        onEngineEvent(eventKind, useCase) {
            engineEventUseCases.set(eventKind, useCase);
            return builder;
        },

        onEarlyUpdate(useCase) {
            phaseUseCases.earlyUpdate = useCase as PhaseUseCase;
            return builder;
        },
        onPhysics(useCase) {
            phaseUseCases.physics = useCase as PhaseUseCase;
            return builder;
        },
        onUpdate(useCase) {
            phaseUseCases.update = useCase as PhaseUseCase;
            return builder;
        },
        onLateUpdate(useCase) {
            phaseUseCases.lateUpdate = useCase as PhaseUseCase;
            return builder;
        },
        onPreRender(useCase) {
            phaseUseCases.preRender = useCase as PhaseUseCase;
            return builder;
        },
        onRender(useCase) {
            phaseUseCases.render = useCase as PhaseUseCase;
            return builder;
        },
        onPostRender(useCase) {
            phaseUseCases.postRender = useCase as PhaseUseCase;
            return builder;
        },

        onDispose(useCase) {
            disposeUseCase = useCase;
            return builder;
        },

        updateWhenPaused(enabled = true) {
            shouldUpdateWhenPaused = enabled;
            return builder;
        },

        build(): EngineSubsystem {
            if (!stateFactory) {
                throw new Error(`Engine Subsystem is missing a state factory. Call .withState() before .build().`);
            }

            const stateRef: { current: TState | undefined } = { current: undefined };

            const engineEventHandlers: EngineSubsystem['engineEventHandlers'] =
                engineEventUseCases.size > 0
                    ? (Object.fromEntries(
                        Array.from(engineEventUseCases.entries()).map(([kind, useCase]) => [
                            kind,
                            (engine: EngineState, event: EngineChangeEvent) => {
                                if (!stateRef.current) stateRef.current = stateFactory({ engine });
                                (useCase as SubsystemUseCase<TState, SubsystemEngineEventParams, void>).execute(
                                    stateRef.current,
                                    { engine, event }
                                );
                            },
                        ])
                    ) as EngineSubsystem['engineEventHandlers'])
                    : undefined;

            return {
                engineEventHandlers,
                earlyUpdate: makeEnginePhaseCallback(phaseUseCases.earlyUpdate, stateRef, stateFactory),
                physics: makeEnginePhaseCallback(phaseUseCases.physics, stateRef, stateFactory),
                update: makeEnginePhaseCallback(phaseUseCases.update, stateRef, stateFactory),
                lateUpdate: makeEnginePhaseCallback(phaseUseCases.lateUpdate, stateRef, stateFactory),
                preRender: makeEnginePhaseCallback(phaseUseCases.preRender, stateRef, stateFactory),
                render: makeEnginePhaseCallback(phaseUseCases.render, stateRef, stateFactory),
                postRender: makeEnginePhaseCallback(phaseUseCases.postRender, stateRef, stateFactory),
                updateWhenPaused: shouldUpdateWhenPaused,
                dispose: () => {
                    if (stateRef.current) {
                        disposeUseCase?.execute(stateRef.current, undefined as void);
                    }
                },
            };
        },
    };

    return builder;
}
