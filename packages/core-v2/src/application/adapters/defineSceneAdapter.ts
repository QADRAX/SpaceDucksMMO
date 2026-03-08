import type { EngineState } from '../../domain/engine';
import type { SceneState } from '../../domain/scene';
import type { AdapterUseCase, AdapterEventUseCase } from '../../domain/useCases';
import type {
    AdapterPortRegistry,
    SceneAdapterFactory,
    AdapterUpdateParams,
} from '../../domain/adapters';
import { composeAdapter } from '../../domain/adapters';

/** Fluent builder for creating a SceneAdapterFactory. */
export interface SceneAdapterBuilder<TState, TPorts = void> {
    /** Declare which ports this adapter consumes from the registry. */
    withPorts<TNewPorts>(
        resolver: (registry: AdapterPortRegistry) => TNewPorts,
    ): SceneAdapterBuilder<TState, TNewPorts>;

    /** Initialize the adapter's internal state (per scene). */
    withState(
        factory: (ctx: { ports: TPorts; scene: SceneState; engine: EngineState }) => TState,
    ): SceneAdapterBuilder<TState, TPorts>;

    /** Register a use case tied to a specific scene event. */
    onEvent<TParams>(useCase: AdapterEventUseCase<TState, TParams, void>): this;

    /** Register a use case for the frame update tick. */
    onUpdate(useCase: AdapterUseCase<TState, AdapterUpdateParams, void>): this;

    /** Register a use case for adapter disposal. */
    onDispose(useCase: AdapterUseCase<TState, void, void>): this;

    /** Enable updates even when the scene/engine is paused. */
    updateWhenPaused(enabled?: boolean): this;

    /** Produces the final SceneAdapterFactory. */
    build(): SceneAdapterFactory;
}

/**
 * Creates a fluent builder to define a SceneAdapterFactory.
 *
 * This pattern centralizes adapter wiring (ports, state, events) into a 
 * single declarative block.
 *
 * @param name - Unique name for the adapter (used in logging/debugging).
 */
export function defineSceneAdapter<TState, TPorts = void>(
    name: string,
): SceneAdapterBuilder<TState, TPorts> {
    let portsResolver: (registry: AdapterPortRegistry) => any = () => undefined;
    let stateFactory: (ctx: { ports: any; scene: SceneState; engine: EngineState }) => TState;

    const eventHandlers: Array<AdapterEventUseCase<TState, any, void>> = [];
    let updateUseCase: AdapterUseCase<TState, AdapterUpdateParams, void> | undefined;
    let disposeUseCase: AdapterUseCase<TState, void, void> | undefined;
    let shouldUpdateWhenPaused = false;

    const builder: SceneAdapterBuilder<TState, any> = {
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

        build(): SceneAdapterFactory {
            if (!stateFactory) {
                throw new Error(`Adapter '${name}' is missing a state factory. Call .withState() before .build().`);
            }

            return (context) => {
                const ports = portsResolver(context.ports);
                const state = stateFactory({
                    ports,
                    scene: context.scene,
                    engine: context.engine
                });

                const composer = composeAdapter(state);

                for (const useCase of eventHandlers) {
                    const kind = useCase.event;
                    composer.on(kind, {
                        name: useCase.name,
                        execute: (s, params) => {
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
