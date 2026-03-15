import { definePort } from '../../subsystems/definePort';
import type { GizmoPortProvider } from './gizmoPortProvider';

export const GIZMO_PORT_PROVIDER_ID = 'io:gizmo-provider';

/**
 * Definition for the GizmoPortProvider.
 * Provides scene-scoped gizmo drawers for debug rendering.
 */
export const GizmoPortProviderDef = definePort<GizmoPortProvider>(GIZMO_PORT_PROVIDER_ID)
  .addMethod('getDrawer')
  .build();
