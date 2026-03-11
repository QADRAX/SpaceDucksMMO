import { definePort } from '../../subsystems/definePort';
import type { GizmoPort } from './gizmoPort';

/**
 * Definition for the GizmoPort.
 * Allows the engine to introspect drawing capabilities.
 */
export const GizmoPortDef = definePort<GizmoPort>('gizmo')
  .addMethod('drawLine')
  .addMethod('drawSphere')
  .addMethod('drawBox')
  .addMethod('drawLabel')
  .addMethod('drawGrid')
  .addMethod('clear')
  .build();
