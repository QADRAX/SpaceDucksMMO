import type {
    PortMethodDefinition,
    PortDefinition,
    PortMethodOptions,
    PortBuilder,
    PortBinding
} from './types';

/**
 * Creates a strong binding between a port definition schema and its runtime implementation.
 */
export function bindPort<T>(definition: PortDefinition<T>, implementation: T): PortBinding<T> {
    return { definition, implementation };
}

/**
 * Creates a builder for defining a strongly-typed subsystem port.
 *
 * This allows the engine to introspect the port's capabilities surface area at runtime,
 * which is especially useful for automatically generating and injecting scripting bridges.
 *
 * @param id The string identifier for the port.
 */
export function definePort<T>(id: string): PortBuilder<T> {
    const methods: PortMethodDefinition[] = [];

    return {
        addMethod(name: keyof T & string, options?: PortMethodOptions) {
            methods.push({ name, async: options?.async ?? false });
            return this;
        },
        build() {
            const def: PortDefinition<T> = {
                id,
                methods: [...methods],
                bind(implementation: T) {
                    return bindPort(def, implementation);
                }
            };
            return def;
        },
    };
}
