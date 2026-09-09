import type { PortBinding } from '../subsystems/types';
import type { DiagnosticPort } from './external/diagnosticPort';
import type { PerformanceProfilingPort } from './external/performanceProfilingPort';
import type { UISurfaceHostPort } from './external/uiSurfaceHostPort';
import type { UIViewRuntimePort } from './external/uiViewRuntimePort';
import type { UISpaRuntimePort } from './external/uiSpaRuntimePort';
import type { SceneEventBusProviderPort } from './internal/sceneEventBusProviderPort';

/**
 * Standardized ports (external dependencies) that can be injected at engine startup.
 * Subsystems can safely assume these contracts if requested from the registry.
 */
export interface EnginePorts {
  /**
   * Diagnostic/logging output.
   * Use consoleDiagnosticPort for a default console implementation.
   */
  readonly diagnostic?: PortBinding<DiagnosticPort>;

  /**
   * Optional frame-by-frame performance profiling.
   * When registered, updateEngine records phase timings for test reports or dev tools.
   */
  readonly performanceProfiling?: PortBinding<PerformanceProfilingPort>;

  /**
   * Event bus provider for UI ↔ scripting. Internal default; consumer can override.
   */
  readonly sceneEventBusProvider?: PortBinding<SceneEventBusProviderPort>;

  /**
   * Host surface per viewport for UI roots (optional until a UI host is wired).
   */
  readonly uiSurfaceHost?: PortBinding<UISurfaceHostPort>;

  /**
   * Duck UI document runtime (optional until a UI host is wired).
   */
  readonly uiViewRuntime?: PortBinding<UIViewRuntimePort>;

  /**
   * Custom SPA UI runtime (optional until a UI host is wired).
   */
  readonly uiSpaRuntime?: PortBinding<UISpaRuntimePort>;
}
