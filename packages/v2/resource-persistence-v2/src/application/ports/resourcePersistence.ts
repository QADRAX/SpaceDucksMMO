import type {
  CommitFileBlobParams,
  CommitResourceBindingParams,
  CommitResourceParams,
  CommitResourceVersionParams,
  ResourceCatalogListItem,
  ResourceCatalogRow,
  ResourceKeySummary,
  ResourceVersionRow,
  ResourceVersionWithFiles,
  ResourceWithVersionHistory,
  StoredFileBlob,
} from '../../domain/engineResource';

export type PatchResourceInput = {
  displayName?: string;
  key?: string;
  activeVersion?: number;
};

/**
 * DB operations available inside `transaction()`. No Prisma types — infrastructure maps them.
 */
export interface ResourcePersistenceTransaction {
  createResource(input: CommitResourceParams): Promise<ResourceCatalogRow>;
  createResourceVersion(input: CommitResourceVersionParams): Promise<ResourceVersionRow>;
  createFileAsset(input: CommitFileBlobParams): Promise<StoredFileBlob>;
  createResourceBinding(input: CommitResourceBindingParams): Promise<void>;
  updateResourceVersion(versionId: string, data: { componentData: string }): Promise<ResourceVersionRow>;
  updateResource(resourceId: string, data: { activeVersion?: number }): Promise<void>;

  findLastResourceVersionNumber(resourceId: string): Promise<number | null>;
  findResourceVersionBare(resourceId: string, version: number): Promise<ResourceVersionRow | null>;

  upsertResourceBinding(resourceVersionId: string, slot: string, fileAssetId: string): Promise<void>;
  findResourceBinding(resourceVersionId: string, slot: string): Promise<{ fileAssetId: string } | null>;

  findOrphanFileAssets(fileIds: string[]): Promise<StoredFileBlob[]>;
  deleteFileAsset(id: string): Promise<void>;

  deleteResourceVersionById(versionId: string): Promise<void>;
  findFileAssetsForVersion(versionId: string): Promise<StoredFileBlob[]>;
}

/**
 * Persistence port for engine resources (implemented by Prisma in infrastructure).
 */
export interface ResourcePersistencePort {
  transaction<T>(fn: (tx: ResourcePersistenceTransaction) => Promise<T>): Promise<T>;

  findResourceSummaryByKey(key: string): Promise<ResourceKeySummary | null>;
  findResourceVersionWithBindings(
    resourceId: string,
    version: number
  ): Promise<ResourceVersionWithFiles | null>;
  findLatestResourceVersion(resourceId: string): Promise<ResourceVersionWithFiles | null>;

  findFileAssetById(id: string): Promise<StoredFileBlob | null>;

  listResourcesForCatalog(filter: { kind?: string }): Promise<ResourceCatalogListItem[]>;
  findResourceByIdWithVersions(id: string): Promise<ResourceWithVersionHistory | null>;

  findResourceVersionId(resourceId: string, version: number): Promise<{ id: string } | null>;
  updateResource(resourceId: string, data: PatchResourceInput): Promise<ResourceCatalogRow>;

  findResourceThumbnailId(resourceId: string): Promise<string | null>;
  findFileAssetsBoundToResource(resourceId: string): Promise<StoredFileBlob[]>;
  deleteResource(resourceId: string): Promise<ResourceCatalogRow>;
  findOrphanFileAssets(fileIds: string[]): Promise<StoredFileBlob[]>;
  deleteFileAsset(id: string): Promise<void>;

  findResourceSummaryById(resourceId: string): Promise<ResourceKeySummary | null>;
  updateResourceActiveVersion(resourceId: string, version: number): Promise<void>;
  findResourceById(resourceId: string): Promise<ResourceCatalogRow | null>;

  findLastResourceVersionNumber(resourceId: string): Promise<number | null>;
  findResourceVersionBare(resourceId: string, version: number): Promise<ResourceVersionRow | null>;

  findResourceSelectKind(resourceId: string): Promise<{ id: string; kind: string } | null>;
  countResourceVersions(resourceId: string): Promise<number>;
}
