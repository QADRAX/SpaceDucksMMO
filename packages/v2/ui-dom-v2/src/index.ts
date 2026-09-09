/**
 * @duckengine/ui-dom-v2
 * DOM host + Duck UI view runtime (default web kit).
 */
export { createDomUISurfaceHost } from './infrastructure/dom/createDomUISurfaceHost';
export type { DomUISurfaceHost } from './infrastructure/dom/createDomUISurfaceHost';
export { createDomUIViewRuntime } from './infrastructure/dom/createDomUIViewRuntime';
export { applyUiRootLayout, renderUiNodeTree } from './infrastructure/dom/renderUiNodeTree';
export {
  createDefaultWebUIPorts,
  type DefaultWebUIPorts,
} from './infrastructure/composition/createDefaultWebUIPorts';
