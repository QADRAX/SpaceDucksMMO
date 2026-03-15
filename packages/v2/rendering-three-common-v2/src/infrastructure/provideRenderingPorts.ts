import type { SubsystemPortProvider } from '@duckengine/core-v2';
import { ViewportRectProviderPortDef } from '@duckengine/core-v2';
import type { ViewportRectProviderPort } from '@duckengine/core-v2';

/**
 * Port provider that registers ViewportRectProviderPort.
 * Same pattern as provideResourceCoordinatorPorts.
 * Consumer provides the implementation via opts in createRenderingSubsystem.
 */
export function provideRenderingPorts(
  viewportRectProvider: ViewportRectProviderPort,
): SubsystemPortProvider {
  return ({ ports }) => {
    if (!ports.has(ViewportRectProviderPortDef)) {
      ports.register(ViewportRectProviderPortDef, viewportRectProvider);
    }
  };
}
