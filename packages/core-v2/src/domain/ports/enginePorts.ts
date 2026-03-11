import type { PortBinding } from '../subsystems/types';
import type { ResourceLoaderPort } from './resourceLoaderPort';
import type { DiagnosticPort } from './diagnosticPort';
import type { UIRendererPort } from './uiRendererPort';
import type { ViewportOverlayProviderPort } from './viewportOverlayProviderPort';
import type { SceneEventBusProviderPort } from './sceneEventBusProviderPort';
import type { UISlotOperationsPort } from './uiSlotOperationsPort';

/**
 * Standardized ports (external dependencies) that can be injected at engine startup.
 * Subsystems can safely assume these contracts if requested from the registry.
 */
export interface EnginePorts {
    /**
     * The global resource loader.
     * Responsible for resolving abstract resource references into data.
     */
    readonly resourceLoader?: PortBinding<ResourceLoaderPort>;

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
     * Event bus provider for UI ↔ scripting. Scripting registers; UI adapter retrieves.
     */
    readonly sceneEventBusProvider?: PortBinding<SceneEventBusProviderPort>;

    /**
     * UI slot operations for scripting bridges. Wraps scene use cases.
     */
    readonly uiSlotOperations?: PortBinding<UISlotOperationsPort>;
}
