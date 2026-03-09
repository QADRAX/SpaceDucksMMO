import type { SubsystemRuntimeState } from '@duckengine/core-v2';

/**
 * Iterates through all dynamically registered engine ports and constructs
 * a record of methods bound to their respective implementations.
 *
 * This pure domain function prepares a flat API table suitable for injection
 * into scripting environments like Lua, ensuring that port methods are 
 * correctly bound dynamically.
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
            if (typeof impl[method.name] === 'function') {
                bridgeTable[method.name] = impl[method.name].bind(impl);
            }
        }

        scriptPorts[id] = bridgeTable;
    }

    return scriptPorts;
}
