/**
 * @duckengine/ui-preact-v2
 * Preact host for Duck UI (default) + helper for custom Preact UIs.
 */
export { createDomUISurfaceHost } from './infrastructure/dom/createDomUISurfaceHost';
export type { DomUISurfaceHost } from './infrastructure/dom/createDomUISurfaceHost';
export { createPreactUIViewRuntime } from './infrastructure/preact/createPreactUIViewRuntime';
export {
  createPreactCustomUI,
  type PreactCustomUIProps,
  type PreactCustomUIRegistration,
} from './infrastructure/preact/createPreactCustomUI';
export { applyUiRootLayout, DuckDocument, renderDuckNode } from './infrastructure/preact/duckDocument';
export type { DuckDocumentProps } from './infrastructure/preact/duckDocument';
export {
  createDefaultWebUIPorts,
  type DefaultWebUIPorts,
  type CreateDefaultWebUIPortsOptions,
} from './infrastructure/composition/createDefaultWebUIPorts';
