import type { ResourceKey } from '../ids';
import type { ResourceKind } from './kinds';

/**
 * A reference to a resource by its key and kind.
 * Reemplaza el uso de strings planos para referencias a recursos.
 */
export interface ResourceRef<K extends ResourceKind> {
    /** The semantic key of the resource (e.g. 'planets/moon'). */
    readonly key: ResourceKey;
    /** The kind of resource expected. */
    readonly kind: K;
    /** Optional version selector. Defaults to active version if omitted. */
    readonly version?: number | 'latest' | 'active';
}

/**
 * Factory to create a strongly-typed ResourceRef.
 *
 * @example
 * const ref = createResourceRef(createResourceKey('planets/moon'), 'texture');
 */
export function createResourceRef<K extends ResourceKind>(
    key: ResourceKey,
    kind: K,
    version?: number | 'latest' | 'active'
): ResourceRef<K> {
    return { key, kind, version };
}

/**
 * Type guard to check if a value is a ResourceRef.
 */
export function isResourceRef(v: unknown): v is ResourceRef<ResourceKind> {
    return (
        v !== null &&
        typeof v === 'object' &&
        'key' in v &&
        'kind' in v &&
        typeof (v as any).key === 'string' &&
        typeof (v as any).kind === 'string'
    );
}
