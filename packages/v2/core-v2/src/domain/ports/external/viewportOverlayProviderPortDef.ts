import { definePort } from '../../subsystems/definePort';
import type { ViewportOverlayProviderPort } from './viewportOverlayProviderPort';

/** Port definition for ViewportOverlayProviderPort. */
export const ViewportOverlayProviderPortDef = definePort<ViewportOverlayProviderPort>(
  'viewportOverlayProvider',
).addMethod('getOverlayContainer').build();
