import type { PortBinding } from '../subsystems/types';
import type { ResourceLoaderPort } from './resourceLoaderPort';
import type { DiagnosticPort } from './diagnosticPort';

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
}
