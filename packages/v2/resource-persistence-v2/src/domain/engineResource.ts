/**
 * Engine resource catalog — domain models for persisted resources and file blobs.
 * (Not HTTP or Prisma row DTOs.)
 */

/** Binary stored for the engine; referenced by resource version bindings. */
export interface StoredFileBlob {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly sha256: string;
  readonly storagePath: string;
}

export interface ResourceSlotBinding {
  readonly slot: string;
  readonly file: StoredFileBlob;
}

/** Version row with JSON component payload and bound files. */
export interface ResourceVersionWithFiles {
  readonly id: string;
  readonly resourceId: string;
  readonly version: number;
  readonly componentType: string;
  readonly componentData: string;
  readonly bindings: ResourceSlotBinding[];
}

/** Version row without bindings (e.g. patch flows). */
export interface ResourceVersionRow {
  readonly id: string;
  readonly resourceId: string;
  readonly version: number;
  readonly componentType: string;
  readonly componentData: string;
}

/** Catalog row for a resource (metadata only). */
export interface ResourceCatalogRow {
  readonly id: string;
  readonly key: string;
  readonly displayName: string;
  readonly kind: string;
  readonly activeVersion: number;
}

/** Minimal fields to resolve by key. */
export interface ResourceKeySummary {
  readonly id: string;
  readonly key: string;
  readonly activeVersion: number;
}

/** Catalog list row with version count. */
export interface ResourceCatalogListItem {
  readonly id: string;
  readonly key: string;
  readonly displayName: string;
  readonly kind: string;
  readonly activeVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly versionCount: number;
}

/** Resource with full nested version history (detail view). */
export interface ResourceWithVersionHistory {
  readonly id: string;
  readonly key: string;
  readonly displayName: string;
  readonly kind: string;
  readonly activeVersion: number;
  readonly thumbnailFileAssetId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly versions: ResourceVersionWithFiles[];
}

/** Intent to persist a new catalog resource. */
export interface CommitResourceParams {
  readonly key: string;
  readonly displayName: string;
  readonly kind: string;
  readonly activeVersion: number;
}

/** Intent to persist a new resource version row. */
export interface CommitResourceVersionParams {
  readonly resourceId: string;
  readonly version: number;
  readonly componentType: string;
  readonly componentData: string;
}

/** Intent to persist file metadata after blob write. */
export interface CommitFileBlobParams {
  readonly id: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
  readonly sha256: string;
  readonly storagePath: string;
}

/** Intent to bind a file to a version slot. */
export interface CommitResourceBindingParams {
  readonly resourceVersionId: string;
  readonly slot: string;
  readonly fileAssetId: string;
}
