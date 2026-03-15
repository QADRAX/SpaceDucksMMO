import type { SubsystemPortRegistry } from '@duckengine/core-v2';
import { GizmoPortDef } from '@duckengine/core-v2';
import type { BridgePorts, GizmoPortShape } from './types';
import { SCRIPTING_BRIDGE_PORT_KEYS } from './types';

/**
 * Resolves scripting bridge ports from ctx.ports (scene subsystem port registry).
 * GizmoPort is registered by rendering in onSceneAdded, so it's available at createState time.
 */
export function resolveBridgePortsFromRegistry(
  ports: SubsystemPortRegistry,
): BridgePorts {
  const gizmo = ports.get<GizmoPortShape>(GizmoPortDef);
  return {
    physicsQuery: ports.getById<BridgePorts['physicsQuery']>(SCRIPTING_BRIDGE_PORT_KEYS.physicsQuery),
    getGizmo: () => gizmo,
    gizmo,
    input: ports.getById<BridgePorts['input']>(SCRIPTING_BRIDGE_PORT_KEYS.input),
    uiSlotOperations: ports.getById<BridgePorts['uiSlotOperations']>(
      SCRIPTING_BRIDGE_PORT_KEYS.uiSlotOperations,
    ),
  };
}
