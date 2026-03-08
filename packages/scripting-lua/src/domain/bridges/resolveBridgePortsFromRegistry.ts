import type { AdapterPortRegistry } from '@duckengine/core-v2';
import type { BridgePorts } from './types';
import { SCRIPTING_BRIDGE_PORT_KEYS } from './types';

/**
 * Resolves scripting bridge ports from the shared engine adapter port registry.
 */
export function resolveBridgePortsFromRegistry(
  ports: AdapterPortRegistry,
): BridgePorts {
  return {
    physicsQuery: ports.get<BridgePorts['physicsQuery']>(SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery),
    gizmo: ports.get<BridgePorts['gizmo']>(SCRIPTING_BRIDGE_PORT_KEYS.gizmo),
    input: ports.get<BridgePorts['input']>(SCRIPTING_BRIDGE_PORT_KEYS.input),
  };
}
