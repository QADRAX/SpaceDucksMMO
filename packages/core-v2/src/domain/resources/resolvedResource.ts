import type { ResourceKey } from '../ids';
import type { ResourceKind } from './kinds';
import type { ResourceData } from './data';
import type { FileSlotsFor } from './fileSlots';

/**
 * A fully resolved resource as returned by the web-core API.
 *
 * Mirrors the API contract:
 * ```
 * { key, resourceId, version, componentType, componentData, files }
 * ```
 *
 * - `componentType` identifies which component type this resource represents.
 * - `componentData` holds the strongly-typed scalar attributes for that component.
 * - `files` holds named, typed file slots for that component kind.
 *
 * @template K The resource kind (= component type discriminator).
 */
export interface ResolvedResource<K extends ResourceKind> {
    /** The semantic key of the resource (e.g. `'planets/moon-surface'`). */
    readonly key: ResourceKey;
    /** The unique resource identifier (UUID from the API). */
    readonly resourceId: string;
    /** The specific version number of this resolution. */
    readonly version: number;
    /** The component type this resource represents. */
    readonly componentType: K;
    /** Strongly-typed scalar attributes for this component kind. */
    readonly componentData: ResourceData<K>;
    /** Named, strongly-typed file slots for this component kind. */
    readonly files: Partial<FileSlotsFor<K>>;
}
