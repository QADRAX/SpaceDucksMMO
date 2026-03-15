import type { SubsystemPortRegistry } from '@duckengine/core-v2';
import type { BridgePorts, GizmoPortShape } from './types';
import { SCRIPTING_BRIDGE_PORT_KEYS } from './types';

/**
 * Resolves scripting bridge ports from ctx.ports (scene subsystem port registry).
 * getGizmo resolves dynamically so rendering can register per-scene when sync runs.
 */
export function resolveBridgePortsFromRegistry(
  ports: SubsystemPortRegistry,
): BridgePorts {
  return {
    physicsQuery: ports.getById<BridgePorts['physicsQuery']>(SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery),
    getGizmo: () => ports.getById<GizmoPortShape>(SCRIPTING_BRIDGE_PORT_KEYS.gizmo),
    gizmo: ports.getById<GizmoPortShape>(SCRIPTING_BRIDGE_PORT_KEYS.gizmo),
    input: ports.getById<BridgePorts['input']>(SCRIPTING_BRIDGE_PORT_KEYS.input),
    uiSlotOperations: ports.getById<BridgePorts['uiSlotOperations']>(
      SCRIPTING_BRIDGE_PORT_KEYS.uiSlotOperations,
    ),
  };
}
