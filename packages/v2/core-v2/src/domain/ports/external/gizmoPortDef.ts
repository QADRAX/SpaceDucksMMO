import { definePort } from '../../subsystems/definePort';
import type { GizmoPort } from './gizmoPort';

/** Port id; must match SCRIPTING_BRIDGE_PORT_KEYS.gizmo in scripting-lua. */
export const GIZMO_PORT_ID = 'io:gizmo';

/**
 * Definition for the GizmoPort.
 * Allows the engine to introspect drawing capabilities.
 */
export const GizmoPortDef = definePort<GizmoPort>(GIZMO_PORT_ID)
  .addMethod('drawLine')
  .addMethod('drawSphere')
  .addMethod('drawBox')
  .addMethod('drawLabel')
  .addMethod('drawGrid')
  .addMethod('clear')
  .build();
