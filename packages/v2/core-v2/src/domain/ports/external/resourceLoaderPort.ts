import type { Result } from '../../utils/types';
import type { ResourceKind, ResourceRef, ResolvedResource } from '../../resources';

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

  /**
   * Fetch a raw file from a URL, with internal caching.
   *
   * @param url The download URL.
   * @param format The requested format ('text' for strings, 'blob' for binary).
   * @returns A Result containing the content or an engine error.
   */
  fetchFile<F extends 'text' | 'blob'>(
    url: string,
    format: F,
  ): Promise<Result<F extends 'text' ? string : Blob>>;
}
