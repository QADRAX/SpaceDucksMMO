import { definePort } from '../../subsystems/definePort';
import type { UIViewRuntimePort } from './uiViewRuntimePort';

/** Port id for {@link UIViewRuntimePort}. */
export const UI_VIEW_RUNTIME_PORT_ID = 'ui:view-runtime';

/** Definition for {@link UIViewRuntimePort}. */
export const UIViewRuntimePortDef = definePort<UIViewRuntimePort>(UI_VIEW_RUNTIME_PORT_ID)
  .addMethod('mount')
  .addMethod('update')
  .addMethod('unmount')
  .build();
