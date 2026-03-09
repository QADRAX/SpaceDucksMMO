import type { ResolvedResource } from '../../domain/resources';

/**
 * Internal state for the Web Resource Loader implementation.
 * Kept in application layer as it's specific to the web networking implementation.
 */
export interface WebResourceLoaderState {
    readonly cache: Map<string, ResolvedResource<any>>;
    readonly fileCache: Map<string, string | Blob>;
}
