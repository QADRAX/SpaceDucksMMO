import type { ResourceKey } from '../ids';
import type { ResourceKind } from './kinds';
import type { FileSlotsFor } from './fileSlots';

/**
 * A fully resolved resource avec its associated files.
 * Reemplaza el ResolvedResource genérico de v1.
 *
 * @template K The kind of the resource.
 */
export interface ResolvedResource<K extends ResourceKind> {
    /** The semantic key of the resource. */
    readonly key: ResourceKey;
    /** The unique resource identifier (UUID). */
    readonly resourceId: string;
    /** The specific version number of this resolution. */
    readonly version: number;
    /** The kind of the resource. */
    readonly kind: K;
    /** Strongly typed file slots for this resource kind. */
    readonly files: Readonly<FileSlotsFor<K>>;
}
