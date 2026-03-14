import type { SubsystemPortRegistry } from '@duckengine/core-v2';
import type { BridgePorts } from './types';
import { SCRIPTING_BRIDGE_PORT_KEYS } from './types';

/**
 * Resolves scripting bridge ports from ctx.ports (scene subsystem port registry).
 */
export function resolveBridgePortsFromRegistry(
  ports: SubsystemPortRegistry,
): BridgePorts {
  return {
    physicsQuery: ports.getById<BridgePorts['physicsQuery']>(SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery),
    gizmo: ports.getById<BridgePorts['gizmo']>(SCRIPTING_BRIDGE_PORT_KEYS.gizmo),
    input: ports.getById<BridgePorts['input']>(SCRIPTING_BRIDGE_PORT_KEYS.input),
    uiSlotOperations: ports.getById<BridgePorts['uiSlotOperations']>(
      SCRIPTING_BRIDGE_PORT_KEYS.uiSlotOperations,
    ),
  };
}
