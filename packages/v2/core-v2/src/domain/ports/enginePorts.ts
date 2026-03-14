import type { PortBinding } from '../subsystems/types';
import type { DiagnosticPort } from './external/diagnosticPort';
import type { UIRendererPort } from './external/uiRendererPort';
import type { ViewportOverlayProviderPort } from './external/viewportOverlayProviderPort';
import type { SceneEventBusProviderPort } from './internal/sceneEventBusProviderPort';
import type { UISlotOperationsPort } from './internal/uiSlotOperationsPort';

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
   * UI renderer adapter. Client mounts SPAs (React, Preact, etc.) in DOM containers.
   */
  readonly uiRenderer?: PortBinding<UIRendererPort>;

  /**
   * Provides overlay DOM container per viewport. Optional; adapter may resolve internally.
   */
  readonly viewportOverlayProvider?: PortBinding<ViewportOverlayProviderPort>;

  /**
   * Event bus provider for UI ↔ scripting. Internal default; consumer can override.
   */
  readonly sceneEventBusProvider?: PortBinding<SceneEventBusProviderPort>;

  /**
   * UI slot operations for scripting bridges. Internal default; consumer can override.
   */
  readonly uiSlotOperations?: PortBinding<UISlotOperationsPort>;
}
