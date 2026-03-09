import type { ResourceLoaderPort } from './resourceLoaderPort';

/**
 * Standardized ports (external dependencies) that can be injected at engine startup.
 * Subsystems can safely assume these contracts if requested from the registry.
 *
 * It acts as an open map (index signature) to maintain backwards compatibility
 * and allow custom project-specific ports, while strongly typing the core ones.
 */
export interface EnginePorts {
    /**
     * The global resource loader.
     * Responsible for resolving abstract resource references into data.
     */
    readonly resourceLoader?: ResourceLoaderPort;

    /**
     * Catch-all for ad-hoc custom ports injected by specific games or plugins.
     */
    readonly [customPort: string]: unknown;
}
