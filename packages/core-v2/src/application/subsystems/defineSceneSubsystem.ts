import type { EngineState } from '../../domain/engine';
import type { SceneState } from '../../domain/scene';
import type { SubsystemUseCase, SubsystemEventUseCase } from '../../domain/useCases';
import type {
    SubsystemPortRegistry,
    SceneSubsystemFactory,
    SubsystemUpdateParams,
} from '../../domain/subsystems';
import { composeSceneSubsystem } from '../../domain/subsystems';

/** Fluent builder for creating a SceneSubsystemFactory. */
export interface SceneSubsystemBuilder<TState, TPorts = void> {
    /** Declare which ports this subsystem consumes from the registry. */
    withPorts<TNewPorts>(
        resolver: (registry: SubsystemPortRegistry) => TNewPorts,
    ): SceneSubsystemBuilder<TState, TNewPorts>;

    /** Initialize the subsystem's internal state (per scene). */
    withState(
        factory: (ctx: { ports: TPorts; scene: SceneState; engine: EngineState }) => TState,
    ): SceneSubsystemBuilder<TState, TPorts>;

    /** Register a use case tied to a specific scene event. */
    onEvent<TParams>(useCase: SubsystemEventUseCase<TState, TParams, void>): this;

    /** Register a use case for the frame update tick. */
    onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;

    /** Register a use case for subsystem disposal. */
    onDispose(useCase: SubsystemUseCase<TState, void, void>): this;

    /** Enable updates even when the scene/engine is paused. */
    updateWhenPaused(enabled?: boolean): this;

    /** Produces the final SceneSubsystemFactory. */
    build(): SceneSubsystemFactory;
}

/**
 * Creates a fluent builder to define a SceneSubsystemFactory.
 *
 * This pattern centralizes subsystem wiring (ports, state, events) into a 
 * single declarative block.
 *
 * @param name - Unique name for the subsystem (used in logging/debugging).
 */
export function defineSceneSubsystem<TState, TPorts = void>(
    name: string,
): SceneSubsystemBuilder<TState, TPorts> {
    let portsResolver: (registry: SubsystemPortRegistry) => any = () => undefined;
    let stateFactory: (ctx: { ports: any; scene: SceneState; engine: EngineState }) => TState;

    const eventHandlers: Array<SubsystemEventUseCase<TState, any, void>> = [];
    let updateUseCase: SubsystemUseCase<TState, SubsystemUpdateParams, void> | undefined;
    let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
    let shouldUpdateWhenPaused = false;

    const builder: SceneSubsystemBuilder<TState, any> = {
        withPorts(resolver) {
            portsResolver = resolver;
            return builder as any;
        },

        withState(factory) {
            stateFactory = factory;
            return builder;
        },

        onEvent(useCase) {
            eventHandlers.push(useCase);
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

        build(): SceneSubsystemFactory {
            if (!stateFactory) {
                throw new Error(`Subsystem '${name}' is missing a state factory. Call .withState() before .build().`);
            }

            return (context: any) => {
                const ports = portsResolver(context.ports);
                const state = stateFactory({
                    ports,
                    scene: context.scene,
                    engine: context.engine
                });

                const composer = composeSceneSubsystem(state);

                for (const useCase of eventHandlers) {
                    const kind = useCase.event;
                    composer.on(kind, {
                        name: useCase.name,
                        execute: (s: any, params: any) => {
                            // Auto-guard by event kind
                            if (params.event.kind !== kind) return;
                            useCase.execute(s, params);
                        }
                    });
                }

                if (updateUseCase) {
                    composer.onUpdate(updateUseCase);
                }

                if (disposeUseCase) {
                    composer.onDispose(disposeUseCase);
                }

                if (shouldUpdateWhenPaused) {
                    composer.updateWhenPaused(true);
                }

                return composer.build();
            };
        },
    };

    return builder;
}
