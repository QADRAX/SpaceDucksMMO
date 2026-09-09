import type { PortBinding } from '@duckengine/core-v2';
import {
  UISurfaceHostPortDef,
  UIViewRuntimePortDef,
} from '@duckengine/core-v2';
import { createDomUISurfaceHost, type DomUISurfaceHost } from '../dom/createDomUISurfaceHost';
import { createDomUIViewRuntime } from '../dom/createDomUIViewRuntime';

/** Default web UI port bindings + the mutable surface host for overlay attach. */
export interface DefaultWebUIPorts {
  readonly ports: ReadonlyArray<PortBinding<unknown>>;
  readonly surfaceHost: DomUISurfaceHost;
}

/**
 * Creates default web UI ports (DOM surface host + Duck view runtime).
 * Composition roots bind `ports` at setup and call `surfaceHost.attachOverlay` per viewport.
 */
export function createDefaultWebUIPorts(): DefaultWebUIPorts {
  const surfaceHost = createDomUISurfaceHost();
  const viewRuntime = createDomUIViewRuntime();
  return {
    surfaceHost,
    ports: [
      UISurfaceHostPortDef.bind(surfaceHost),
      UIViewRuntimePortDef.bind(viewRuntime),
    ],
  };
}
