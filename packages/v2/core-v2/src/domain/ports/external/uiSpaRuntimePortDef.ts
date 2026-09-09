import { definePort } from '../../subsystems/definePort';
import type { UISpaRuntimePort } from './uiSpaRuntimePort';

/** Port id for {@link UISpaRuntimePort}. */
export const UI_SPA_RUNTIME_PORT_ID = 'ui:spa-runtime';

/** Definition for {@link UISpaRuntimePort}. */
export const UISpaRuntimePortDef = definePort<UISpaRuntimePort>(UI_SPA_RUNTIME_PORT_ID)
  .addMethod('mount')
  .addMethod('update')
  .addMethod('unmount')
  .build();
