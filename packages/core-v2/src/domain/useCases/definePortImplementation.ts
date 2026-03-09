import type { PortUseCase, PortImplementationBuilder } from './types';
import type { PortDefinition, PortBinding } from '../subsystems/types';

/**
 * Helper to strongly type a PortUseCase tailored for a specific method of a port interface.
 * Provides IDE autocomplete and signature verification without inline type assertions.
 * 
 * @template TState The internal closure state format of the port.
 * @template TPort The interface contract the port implements.
 * @template K The name of the method on the port interface to bind to.
 */
export function definePortUseCase<
    TState,
    TPort,
    K extends Extract<keyof TPort, string>
>(useCase: PortUseCase<
    TState,
    TPort[K] extends (...args: any[]) => any ? Parameters<TPort[K]> : [],
    TPort[K] extends (...args: any[]) => any ? ReturnType<TPort[K]> : void
>): PortUseCase<
    TState,
    TPort[K] extends (...args: any[]) => any ? Parameters<TPort[K]> : [],
    TPort[K] extends (...args: any[]) => any ? ReturnType<TPort[K]> : void
> {
    return useCase;
}

/**
 * Starts building a new Port Implementation.
 * 
 * @param definition The definition schema of the port to implement.
 * @returns A builder to configure the Port with state and method UseCases.
 */
export function definePortImplementation<TState, TPort, TContext = void>(
    definition: PortDefinition<TPort>
): PortImplementationBuilder<TState, TPort, TContext> {
    let stateFactory: (ctx: TContext) => TState;
    const methods: Partial<Record<keyof TPort, PortUseCase<TState, any, any>>> = {};

    const builder: PortImplementationBuilder<TState, TPort, TContext> = {
        withState(factory) {
            stateFactory = factory;
            return builder;
        },
        withMethod(name, useCase) {
            methods[name] = useCase;
            return builder;
        },
        build(...args: any[]): PortBinding<TPort> {
            if (!stateFactory) {
                throw new Error('Port Implementation is missing a state factory. Call .withState() before .build().');
            }

            const context = args[0] as TContext;
            const state = stateFactory(context);

            const port = {} as TPort;
            for (const [key, useCase] of Object.entries(methods)) {
                // Spread the arguments into the `params` tuple array when called by the consumer
                (port as any)[key] = (...args: any[]) => (useCase as PortUseCase<TState, any, any>).execute(state, args);
            }

            return definition.bind(port);
        }
    };

    return builder;
}
