import type { BlobStorage } from '../application/ports/blobStorage';
import type { PublicUrlResolver } from '../application/ports/publicUrl';
import type { ResourcePersistencePort } from '../application/ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../application/ports/resourcePersistenceDeps';
import type { ResourceUploadRegistryPort } from '../application/ports/resourceUploadRegistryPort';
import type { ZipReader } from '../application/ports/zipReader';

/**
 * Injectable runtime context for HTTP handlers (Next, Hono, etc.).
 */
export type ResourcePersistenceContext = {
  resourcePersistence: ResourcePersistencePort;
  blobStorage: BlobStorage;
  publicUrls: PublicUrlResolver;
  fileApiPathForFileId?: (fileId: string) => string;
  zipReader: ZipReader;
  /** Override default upload handler registry (tests / custom kinds). */
  uploadRegistry?: ResourceUploadRegistryPort;
  /**
   * Optional hook (e.g. auth) before routes that mutate the resource catalog.
   * Return a `Response` to short-circuit; otherwise the handler continues.
   */
  beforeResourceWriteRequest?: (request: Request) => Promise<Response | undefined>;
};

export function defaultFileApiPathForFileId(fileId: string): string {
  return `/api/files/${fileId}`;
}

/** HTTP context without upload registry (merge in composition root with {@link ResourcePersistenceContext.uploadRegistry} or infra adapter). */
export function resourcePersistenceContextToDeps(
  ctx: ResourcePersistenceContext
): Omit<ResourcePersistenceUseCaseDeps, 'uploadRegistry'> {
  return {
    resourcePersistence: ctx.resourcePersistence,
    blobStorage: ctx.blobStorage,
    publicUrls: ctx.publicUrls,
    zipReader: ctx.zipReader,
    fileApiPathForFileId: ctx.fileApiPathForFileId ?? defaultFileApiPathForFileId,
  };
}
