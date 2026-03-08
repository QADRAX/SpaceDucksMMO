import type { Result } from '../utils/types';
import type { ResourceKind, ResourceRef, ResolvedResource } from '../resources';

/**
 * Contract for runtime resource resolution.
 * Implementations resolve from web-core, local files, bundled assets, etc.
 */
export interface ResourceLoaderPort {
  /**
   * Resolve a resource by its reference.
   *
   * @template K The kind of the resource.
   * @param ref The resource reference (key + kind + optional version).
   * @returns A Result containing the resolved resource or an engine error.
   */
  resolve<K extends ResourceKind>(ref: ResourceRef<K>): Promise<Result<ResolvedResource<K>>>;
}
