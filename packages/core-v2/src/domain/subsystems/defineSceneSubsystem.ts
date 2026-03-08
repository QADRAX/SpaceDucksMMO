import type { EngineState } from '../engine';
import type { SceneState } from '../scene';
import type { SubsystemUseCase, SubsystemEventUseCase } from '../useCases';
import type {
    SubsystemPortRegistry,
    SceneSubsystemFactory,
    SubsystemUpdateParams,
    SceneSubsystemBuilder,
    SceneSubsystemFactoryContext,
} from './types';
import { composeSceneSubsystem } from './composeSceneSubsystem';

/**
 * Creates a fluent builder to define a SceneSubsystemFactory.
 *
 * This pattern centralizes subsystem wiring (ports, state, events) into a 
 * single declarative block.
 *
 * @param name - Unique name for the subsystem (used in logging/debugging).
 * @returns A builder to configure the subsystem.
 */
export function defineSceneSubsystem<TState, TPorts = void>(
    name: string,
): SceneSubsystemBuilder<TState, TPorts> {
    let portsResolver: (registry: SubsystemPortRegistry) => TPorts = (() => undefined) as any;
    let stateFactory: (ctx: { ports: TPorts; scene: SceneState; engine: EngineState }) => TState;

    const eventHandlers: Array<SubsystemEventUseCase<TState, unknown, void>> = [];
    let updateUseCase: SubsystemUseCase<TState, SubsystemUpdateParams, void> | undefined;
    let disposeUseCase: SubsystemUseCase<TState, void, void> | undefined;
    let shouldUpdateWhenPaused = false;

    const builder: SceneSubsystemBuilder<TState, TPorts> = {
        withPorts<TNewPorts>(resolver: (registry: SubsystemPortRegistry) => TNewPorts): SceneSubsystemBuilder<TState, TNewPorts> {
            portsResolver = resolver as any;
            return builder as unknown as SceneSubsystemBuilder<TState, TNewPorts>;
        },

        withState(factory) {
            stateFactory = factory;
            return builder;
        },

        onEvent(useCase) {
            eventHandlers.push(useCase as SubsystemEventUseCase<TState, unknown, void>);
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

            return (context: SceneSubsystemFactoryContext) => {
                const ports = portsResolver(context.ports);
                const state = stateFactory({
                    ports,
                    scene: context.scene,
                    engine: context.engine,
                });

                const composer = composeSceneSubsystem(state);

                for (const useCase of eventHandlers) {
                    const kind = (useCase as any).event; // We know it's a SubsystemEventUseCase
                    composer.on(kind, {
                        name: useCase.name,
                        execute: (s: TState, params: any) => {
                            // Auto-guard by event kind
                            if (params.event.kind !== kind) return;
                            useCase.execute(s, params);
                        },
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
