import { definePort } from '../../subsystems/definePort';
import type { ViewportRectProviderPort } from './viewportRectProviderPort';

/** Port definition for ViewportRectProviderPort. */
export const ViewportRectProviderPortDef = definePort<ViewportRectProviderPort>(
  'viewportRectProvider',
)
  .addMethod('getRect')
  .addMethod('setRect')
  .build();
