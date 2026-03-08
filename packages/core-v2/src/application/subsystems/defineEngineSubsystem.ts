import type { EngineState } from '../../domain/engine';
import type { SubsystemUseCase } from '../../domain/useCases';
import type { EngineSubsystem } from '../../domain/subsystems';

/** Fluent builder for creating an EngineSubsystem. */
export interface EngineSubsystemBuilder<TState> {
    /** Initialize the subsystem's internal state. */
    withState(
        factory: (ctx: { engine: EngineState }) => TState,
    ): EngineSubsystemBuilder<TState>;

    /** Register a use case for the engine frame update tick. */
    onUpdate(useCase: SubsystemUseCase<TState, { engine: EngineState; dt: number }, void>): this;

    /** Register a use case for subsystem disposal. */
    onDispose(useCase: SubsystemUseCase<TState, void, void>): this;

    /** Enable updates even when the engine is paused. */
    updateWhenPaused(enabled?: boolean): this;

    /** Produces the final EngineSubsystem. */
    build(): EngineSubsystem;
}

/**
 * Creates a fluent builder to define an EngineSubsystem.
 *
 * @param name - Unique name for the subsystem (used in logging/debugging).
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

            // Engine subsystems are instantiated immediately at engine level (or lazily on first access if we wanted)
            // But for now, we just return the object shape EngineSubsystem expects.
            // Note: In core-v2, EngineSubsystem doesn't have a factory-per-scene, it's global.

            // We need a way to store the state. Since EngineSubsystem is just an interface with update/dispose,
            // we'll instantiate the state right here and bind the methods.

            // TODO: In a more advanced implementation, the engine would hold the state.
            // For now, we'll use a closure-captured state.

            let state: TState | undefined;

            return {
                update: (engine: any, dt: number) => {
                    if (!state) state = stateFactory({ engine });
                    updateUseCase?.execute(state, { engine, dt });
                },
                updateWhenPaused: shouldUpdateWhenPaused,
                dispose: () => {
                    if (state) {
                        disposeUseCase?.execute(state, undefined as void);
                    }
                }
            };
        },
    };

    return builder;
}
