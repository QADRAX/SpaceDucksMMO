import type { ResolvedResource, ResourceVersionSelector } from '../assets';

/**
 * Contract for runtime resource resolution.
 * Implementations resolve from web-core, local files, bundled assets, etc.
 */
export interface ResourceLoaderPort {
  /** Resolve a resource by key and optional version selector. */
  resolve(key: string, version?: ResourceVersionSelector): Promise<ResolvedResource>;
}
