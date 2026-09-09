import type { DuckEngineAPI } from '@duckengine/core-v2';
import type { LogStack } from '@duckengine/diagnostic-v2';
import type { DomUISurfaceHost } from '@duckengine/ui-dom-v2';

/**
 * Web client API for the DuckEngine.
 * Omits setup and registerSubsystem — the facade calls setup internally.
 * Includes logStack for log inspection (file export, UI console, etc.).
 */
export type DuckEngineWebClient = Omit<
  DuckEngineAPI,
  'setup' | 'registerSubsystem'
> & {
  /** Log stack for engine diagnostics. Use getEntries() for export/UI. */
  logStack: LogStack;
  /**
   * DOM UI surface host. Call `attachOverlay(viewportId, parent)` once the
   * viewport canvas container is ready so Duck UI roots can paint.
   */
  uiSurfaceHost: DomUISurfaceHost;
};
