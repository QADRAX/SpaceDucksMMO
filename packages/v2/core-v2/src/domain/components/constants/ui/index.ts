import { TRANSFORM2D_SPEC } from './transform2d';
import { UI_VIEW_SPEC } from './uiView';
import { UI_SPA_SPEC } from './uiSpa';

export {
  TRANSFORM2D_SPEC,
  createTransform2dComponent,
  createTransform2dPose,
  type Transform2dCreateOverride,
} from './transform2d';
export { UI_VIEW_SPEC } from './uiView';
export { UI_SPA_SPEC } from './uiSpa';

/** Specs map entries for the central component registry. */
export const UI_SPECS = {
  transform2d: TRANSFORM2D_SPEC,
  uiView: UI_VIEW_SPEC,
  uiSpa: UI_SPA_SPEC,
};
