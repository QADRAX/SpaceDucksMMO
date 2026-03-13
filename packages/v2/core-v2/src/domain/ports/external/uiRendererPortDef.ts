import { definePort } from '../../subsystems/definePort';
import type { UIRendererPort } from './uiRendererPort';

/** Port definition for UIRendererPort. */
export const UIRendererPortDef = definePort<UIRendererPort>('uiRenderer')
  .addMethod('mount')
  .addMethod('unmount')
  .addMethod('updateSlot')
  .build();
