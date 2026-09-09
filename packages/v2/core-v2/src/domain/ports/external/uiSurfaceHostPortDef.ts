import { definePort } from '../../subsystems/definePort';
import type { UISurfaceHostPort } from './uiSurfaceHostPort';

/** Port id for {@link UISurfaceHostPort}. */
export const UI_SURFACE_HOST_PORT_ID = 'ui:surface-host';

/** Definition for {@link UISurfaceHostPort}. */
export const UISurfaceHostPortDef = definePort<UISurfaceHostPort>(UI_SURFACE_HOST_PORT_ID)
  .addMethod('getSurface')
  .build();
