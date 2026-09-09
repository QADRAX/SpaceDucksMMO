import { definePort } from '../../subsystems/definePort';
import type { UICustomRuntimePort } from './uiCustomRuntimePort';

/** Port id for {@link UICustomRuntimePort}. */
export const UI_CUSTOM_RUNTIME_PORT_ID = 'ui:custom-runtime';

/** Definition for {@link UICustomRuntimePort}. */
export const UICustomRuntimePortDef = definePort<UICustomRuntimePort>(UI_CUSTOM_RUNTIME_PORT_ID)
  .addMethod('mount')
  .addMethod('update')
  .addMethod('unmount')
  .build();
