export { PrismaClient } from './generated/prisma';

export type { ResolvedFile, ResolvedResource } from '@duckengine/core-v2';

export {
  resolveResource,
  resolveResourceUseCase,
} from './application/useCases/resolveResource';
export {
  getFileAssetDownload,
  getFileAssetDownloadUseCase,
} from './application/useCases/getFileAssetDownload';
export {
  listSupportedResourceKinds,
  listSupportedResourceKindsUseCase,
} from './application/useCases/listSupportedResourceKinds';

export { listResources, listResourcesUseCase } from './application/useCases/listResources';
export { getResourceWithVersions, getResourceWithVersionsUseCase } from './application/useCases/getResourceWithVersions';
export { patchResource, patchResourceUseCase } from './application/useCases/patchResource';
export { deleteResource, deleteResourceUseCase } from './application/useCases/deleteResource';
export { listResourceVersions, listResourceVersionsUseCase } from './application/useCases/listResourceVersions';
export { setResourceActiveVersion, setResourceActiveVersionUseCase } from './application/useCases/setResourceActiveVersion';
export { createResourceFromJson, createResourceFromJsonUseCase } from './application/useCases/createResourceFromJson';
export {
  createResourceFromMultipart,
  createResourceFromMultipartUseCase,
} from './application/useCases/createResourceFromMultipart';
export {
  createResourceVersionFromMultipart,
  createResourceVersionFromMultipartUseCase,
} from './application/useCases/createResourceVersionFromMultipart';
export { patchResourceVersion, patchResourceVersionUseCase } from './application/useCases/patchResourceVersion';
export { deleteResourceVersion, deleteResourceVersionUseCase } from './application/useCases/deleteResourceVersion';

export {
  createResourceFromZipUseCase,
} from './application/useCases/createResourceFromZip';
export {
  createResourceVersionFromZipUseCase,
} from './application/useCases/createResourceVersionFromZip';

export type { BlobStorage, SavedBlob } from './application/ports/blobStorage';
export type { PublicUrlResolver, PublicUrlResolverOptions } from './application/ports/publicUrl';
export { createPublicUrlResolver } from './application/ports/publicUrl';
export type { ZipReader, ZipFileEntry } from './application/ports/zipReader';
export { parseZipJson } from './application/ports/zipReader';
export type {
  ResourcePersistencePort,
  ResourcePersistenceTransaction,
  PatchResourceInput,
} from './application/ports/resourcePersistence';
export type {
  ResourcePersistenceUseCaseDeps,
  ResourcePersistenceFileDeps,
} from './application/ports/resourcePersistenceDeps';

export { defineResourceUseCase, type ResourceUseCase } from './domain/useCases';

export type { ResourcePersistenceApplication } from './presentation/createResourcePersistenceAPI.docs';
export {
  buildResourcePersistenceAPI,
  createResourcePersistenceAPI,
} from './presentation/createResourcePersistenceAPI';
export {
  resourcePersistenceContextToDeps,
  type ResourcePersistenceContext,
  defaultFileApiPathForFileId,
} from './presentation/resourcePersistenceContext';

export type * from './domain/resourcePersistence/useCaseTypes';

export type {
  StoredFileBlob,
  ResourceSlotBinding,
  ResourceVersionWithFiles,
  ResourceVersionRow,
  ResourceCatalogRow,
  ResourceKeySummary,
  ResourceCatalogListItem,
  ResourceWithVersionHistory,
  CommitResourceParams,
  CommitResourceVersionParams,
  CommitFileBlobParams,
  CommitResourceBindingParams,
} from './domain/engineResource';

export { createPrismaResourcePersistence } from './infrastructure/persistence/prismaResourcePersistence';

export { LocalBlobStorage } from './infrastructure/storage/localBlobStorage';
export { S3BlobStorage } from './infrastructure/storage/s3BlobStorage';
export { AzureBlobStorage } from './infrastructure/storage/azureBlobStorage';
export { AdmZipReader } from './infrastructure/zip/admZipReader';

export {
  RESOURCE_KINDS,
  MATERIAL_RESOURCE_KINDS,
  CUSTOM_SHADER_RESOURCE_KINDS,
  type ResourceKind,
  type MaterialResourceKind,
  type CustomShaderResourceKind,
} from './domain/kinds';
export { registerDefaultUploadHandlers } from './infrastructure/upload/registerDefaultUploadHandlers';

export { createResourcePersistenceHandlers, type ResourcePersistenceHandlers } from './http/httpHandlers';
