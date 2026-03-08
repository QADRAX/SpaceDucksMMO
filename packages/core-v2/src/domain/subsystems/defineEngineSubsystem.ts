import type { EngineState } from '../engine';
import type { SubsystemUseCase } from '../useCases';
import type { EngineSubsystem, EngineSubsystemBuilder } from './types';

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
    let updateUseCase: SubsystemUseCase<TState, { engine: EngineState; dt: number }, void> | undefined;
    let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
    let shouldUpdateWhenPaused = false;

    const builder: EngineSubsystemBuilder<TState> = {
        withState(factory) {
            stateFactory = factory;
            return builder;
        },

        onUpdate(useCase) {
            updateUseCase = useCase;
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

            let state: TState | undefined;

            return {
                update: (engine: EngineState, dt: number) => {
                    if (!state) state = stateFactory({ engine });
                    updateUseCase?.execute(state, { engine, dt });
                },
                updateWhenPaused: shouldUpdateWhenPaused,
                dispose: () => {
                    if (state) {
                        disposeUseCase?.execute(state, undefined as void);
                    }
                },
            };
        },
    };

    return builder;
}
