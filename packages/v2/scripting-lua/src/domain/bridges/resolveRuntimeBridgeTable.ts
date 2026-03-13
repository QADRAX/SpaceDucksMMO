import type { SubsystemRuntimeState } from '@duckengine/core-v2';

/**
 * Wraps an async port method so Lua can call it with a callback as the last argument.
 * Convention: callback(err, result) — err is nil on success, result is the data.
 * Use undefined (not null) for err on success — wasmoon throws when passing null.
 */
function wrapAsyncWithCallback(
    fn: (...args: unknown[]) => Promise<unknown>,
): (...args: unknown[]) => void {
    return function (this: unknown, ...args: unknown[]) {
        const last = args[args.length - 1];
        // For async methods, last arg is callback when 2+ args (Lua: fetchData(id, fn))
        const useCallback = args.length >= 2;
        if (useCallback) {
            const callback = last as (err: unknown, result?: unknown) => void;
            const rest = args.slice(0, -1);
            fn.apply(this, rest)
                .then((result) => callback(undefined, result))
                .catch((err) => callback(err, undefined));
        } else {
            fn.apply(this, args);
        }
    };
}

/**
 * Iterates through all dynamically registered engine ports and constructs
 * a record of methods bound to their respective implementations.
 *
 * Async methods (method.async === true) are wrapped so that when the last
 * argument is a function, it is treated as a callback: (err, result).
 * This allows Lua to use async ports without blocking.
 */
export function resolveRuntimeBridgeTable(
    runtimeState: SubsystemRuntimeState,
): Record<string, Record<string, Function>> {
    const { portDefinitions, ports: portImplementations } = runtimeState;
    const scriptPorts: Record<string, Record<string, Function>> = {};

    for (const [id, def] of portDefinitions.entries()) {
        const impl = portImplementations.get(id) as Record<string, Function> | undefined;
        if (!impl) continue;

        const bridgeTable: Record<string, Function> = {};

        for (const method of def.methods) {
            const rawFn = impl[method.name];
            if (typeof rawFn !== 'function') continue;

            if (method.async) {
                bridgeTable[method.name] = wrapAsyncWithCallback(
                    rawFn.bind(impl) as (...args: unknown[]) => Promise<unknown>,
                );
            } else {
                bridgeTable[method.name] = rawFn.bind(impl);
            }
        }

        scriptPorts[id] = bridgeTable;
    }

    return scriptPorts;
}
