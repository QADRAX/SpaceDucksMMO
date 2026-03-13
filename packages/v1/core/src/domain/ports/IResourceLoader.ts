import type { ResolvedResource, ResourceVersionSelector } from '../assets/ResourceTypes';

/**
 * Generic runtime resource loader port.
 *
 * Implementations can resolve resources from web-core, local files, bundled
 * assets, or any custom backend.
 */
export interface IResourceLoader {
  resolve(
    key: string,
    version?: ResourceVersionSelector
  ): Promise<ResolvedResource>;
}
