import type { ViewportId, UISurfaceHandle, UISurfaceHostPort } from '@duckengine/core-v2';

/**
 * In-memory surface host for tests and headless projection.
 */
export function createMemoryUISurfaceHost(
  initial: ReadonlyArray<{ viewportId: ViewportId; hostRef?: unknown }> = [],
): UISurfaceHostPort & {
  setSurface(viewportId: ViewportId, hostRef?: unknown): void;
  clearSurface(viewportId: ViewportId): void;
} {
  const map = new Map<ViewportId, unknown>();
  for (const entry of initial) {
    map.set(entry.viewportId, entry.hostRef ?? { id: entry.viewportId });
  }

  return {
    setSurface(viewportId, hostRef) {
      map.set(viewportId, hostRef ?? { id: viewportId });
    },
    clearSurface(viewportId) {
      map.delete(viewportId);
    },
    getSurface(viewportId: ViewportId): UISurfaceHandle | undefined {
      if (!map.has(viewportId)) return undefined;
      return { viewportId, hostRef: map.get(viewportId) };
    },
  };
}
