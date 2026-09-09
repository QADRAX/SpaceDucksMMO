import type { PortBinding } from '@duckengine/core-v2';
import {
  UISurfaceHostPortDef,
  UIViewRuntimePortDef,
  UICustomRuntimePortDef,
} from '@duckengine/core-v2';
import { createDomUISurfaceHost, type DomUISurfaceHost } from '../dom/createDomUISurfaceHost';
import { createPreactUIViewRuntime } from '../preact/createPreactUIViewRuntime';
import {
  createPreactCustomUI,
  type PreactCustomUIRegistration,
} from '../preact/createPreactCustomUI';

/** Default web UI port bindings + the mutable surface host for overlay attach. */
export interface DefaultWebUIPorts {
  readonly ports: ReadonlyArray<PortBinding<unknown>>;
  readonly surfaceHost: DomUISurfaceHost;
}

/** Options for default Preact web UI ports. */
export interface CreateDefaultWebUIPortsOptions {
  /** Optional Preact custom UI registrations for `uiCustom` roots. */
  readonly customUIs?: ReadonlyArray<PreactCustomUIRegistration>;
}

/**
 * Creates default web UI ports (DOM surface + Preact Duck runtime + optional custom Preact UIs).
 */
export function createDefaultWebUIPorts(
  options?: CreateDefaultWebUIPortsOptions,
): DefaultWebUIPorts {
  const surfaceHost = createDomUISurfaceHost();
  const viewRuntime = createPreactUIViewRuntime();
  const ports: PortBinding<unknown>[] = [
    UISurfaceHostPortDef.bind(surfaceHost),
    UIViewRuntimePortDef.bind(viewRuntime),
  ];
  if (options?.customUIs?.length) {
    ports.push(UICustomRuntimePortDef.bind(createPreactCustomUI(options.customUIs)));
  }
  return { surfaceHost, ports };
}
