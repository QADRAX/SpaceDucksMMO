import type { BlobStorage } from './blobStorage';
import type { PublicUrlResolver } from './publicUrl';
import type { ResourcePersistencePort } from './resourcePersistence';
import type { ResourceUploadRegistryPort } from './resourceUploadRegistryPort';
import type { ZipReader } from './zipReader';

/**
 * Injectable aggregate for all resource-persistence use cases (DI root).
 * Aligns with {@link ResourcePersistenceContext} once `uploadRegistry` is merged at the composition root.
 */
export type ResourcePersistenceUseCaseDeps = {
  readonly resourcePersistence: ResourcePersistencePort;
  readonly blobStorage: BlobStorage;
  readonly publicUrls: PublicUrlResolver;
  readonly zipReader: ZipReader;
  readonly fileApiPathForFileId: (fileId: string) => string;
  readonly uploadRegistry: ResourceUploadRegistryPort;
};

/**
 * Subset of {@link ResourcePersistenceUseCaseDeps} for operations that need blob storage,
 * zip reading, slot uploads, and public file URLs, but not {@link PublicUrlResolver} for engine resolve.
 */
export type ResourcePersistenceFileDeps = Pick<
  ResourcePersistenceUseCaseDeps,
  'resourcePersistence' | 'blobStorage' | 'zipReader' | 'fileApiPathForFileId' | 'uploadRegistry'
>;
