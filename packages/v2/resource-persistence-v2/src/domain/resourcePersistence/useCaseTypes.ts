import type { Readable } from 'stream';

import type { ResourceData, ResourceKind, ResolvedFile } from '@duckengine/core-v2';

/**
 * Inputs and outputs for resource-persistence application use cases.
 *
 * These types are actor-agnostic: they describe persistence operations only, not whether the
 * caller is a web UI, game server, CLI, or test harness.
 *
 * Shapes follow `@duckengine/core-v2` `domain/resources` (`ResourceKind`, `ResourceData`, `ResolvedFile`).
 *
 * @module
 */

// ——— Resolve (engine runtime) ———

/**
 * Parameters for resolving a resource by catalog key for engine consumption.
 */
export type ResolveResourceParams = {
  /** Stable resource key in the catalog. */
  readonly key: string;
  /**
   * Version selector: numeric string, `active`, `default`, or `latest`.
   * Omitted or null behaves like `active`.
   */
  readonly version?: string | null;
};

/**
 * Per-slot file entry for a resolved resource (URLs + metadata for loaders).
 * Narrows {@link ResolvedFile} with required storage fields from persistence.
 */
export type ResolvedResourceFileEntry = ResolvedFile & {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly sha256: string;
};

/**
 * Resolved payload aligned with `ResolvedResource` in `@duckengine/core-v2` (`domain/resources/resolvedResource.ts`).
 * `componentData` is the scalar {@link ResourceData} union for the resolved `componentType`.
 */
export type ResolvedResourcePayload = {
  readonly key: string;
  readonly resourceId: string;
  readonly version: number;
  readonly componentType: ResourceKind;
  readonly componentData: ResourceData<ResourceKind>;
  readonly files: Partial<Record<string, ResolvedResourceFileEntry>>;
};

// ——— File asset download ———

/**
 * Result of opening a stored file asset for streaming download.
 */
export type FileDownloadResult =
  | {
      readonly ok: true;
      readonly contentType: string;
      readonly sha256: string;
      readonly stream: Readable;
    }
  | { readonly ok: false; readonly reason: 'not_found' | 'blob_missing' };

// ——— Import from zip ———

/**
 * Input for creating a new catalog resource and its first version from a zip bundle.
 */
export type CreateResourceFromZipInput = {
  readonly zipBuffer: Buffer;
};

/**
 * Output: created resource row and first version row identifiers.
 */
export type CreateResourceFromZipResult = {
  readonly resource: { readonly id: string; readonly key: string; readonly kind: ResourceKind };
  readonly version: { readonly id: string; readonly version: number };
};

/**
 * Input for appending a new version from a zip bundle.
 */
export type CreateResourceVersionFromZipInput = {
  readonly resourceId: string;
  readonly resourceKind: ResourceKind;
  readonly zipBuffer: Buffer;
};

/**
 * Output: created version row identifiers.
 */
export type CreateResourceVersionFromZipResult = {
  readonly id: string;
  readonly resourceId: string;
  readonly version: number;
};

// ——— Catalog listing & detail ———

/**
 * Filter catalog rows by optional engine resource kind.
 */
export type ListResourcesInput = {
  readonly kindFilter?: ResourceKind | string | null;
};

/**
 * Paginated-style list result (count matches data length in current implementation).
 */
export type ListResourcesResult = {
  readonly data: unknown[];
  readonly count: number;
};

/**
 * Load one resource with full nested version history.
 */
export type GetResourceWithVersionsInput = {
  readonly resourceId: string;
};

// ——— Resource metadata ———

/**
 * Partial update to resource metadata (key, display name, active version pointer).
 * Distinct from the persistence port’s `PatchResourceInput` row patch shape.
 */
export type PatchResourceMetadataInput = {
  readonly resourceId: string;
  readonly body: unknown;
};

export type PatchResourceMetadataResult =
  | { readonly ok: true; readonly resource: unknown }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Remove a resource and clean up unreferenced file blobs when safe.
 */
export type DeleteResourceByIdInput = {
  readonly resourceId: string;
};

// ——— Versions ———

export type ListResourceVersionsInput = {
  readonly resourceId: string;
};

export type ListResourceVersionsResult = {
  readonly data: unknown[];
  readonly count: number;
};

/**
 * Point the catalog’s active version to an existing version number.
 */
export type SetResourceActiveVersionInput = {
  readonly resourceId: string;
  readonly versionNumber: number;
};

export type SetResourceActiveVersionResult =
  | { readonly ok: true; readonly resource: unknown }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Create a resource with JSON body only (empty initial component payload).
 */
export type CreateResourceFromJsonInput = {
  readonly body: unknown;
};

export type CreateResourceFromJsonResult =
  | { readonly ok: true; readonly resource: unknown }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Multipart create: optional zip or field-based file slots.
 */
export type CreateResourceFromMultipartResult = {
  readonly resource: unknown;
  readonly version?: unknown;
};

/**
 * Multipart append version for an existing resource.
 */
export type CreateResourceVersionFromMultipartInput = {
  readonly resourceId: string;
  readonly formData: FormData;
};

/**
 * Patch a single version: JSON body and/or multipart file replacements per slot.
 */
export type PatchResourceVersionInput = {
  readonly resourceId: string;
  readonly versionNumber: number;
  readonly contentType: string;
  readonly bodyJson: unknown;
  readonly formData: FormData | null;
};

export type PatchResourceVersionResult =
  | { readonly ok: true; readonly version: unknown }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Delete one non-active version and remove orphaned blobs when safe.
 */
export type DeleteResourceVersionInput = {
  readonly resourceId: string;
  readonly versionNumber: number;
};

export type DeleteResourceVersionResult =
  | { readonly ok: true; readonly deleted: unknown }
  | { readonly ok: false; readonly status: number; readonly error: string };
