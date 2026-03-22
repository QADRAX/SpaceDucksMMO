/**
 * @file Stream file asset by id
 *
 * Resolves a `FileAsset` row, checks the blob exists on `BlobStorage`, and returns a readable
 * stream plus content metadata for HTTP download or reverse proxy.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type { FileDownloadResult } from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';
import type { BlobStorage } from '../ports/blobStorage';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';

type GetFileDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence' | 'blobStorage'>;

/**
 * Use case: file download — `fileId` is the primary input; second generic is the string id.
 */
export const getFileAssetDownloadUseCase = defineResourceUseCase<GetFileDeps, string, FileDownloadResult>({
  name: 'getFileAssetDownload',
  async run(deps, fileId) {
    const store = deps.resourcePersistence;
    const blobStorage = deps.blobStorage;

    const fileAsset = await store.findFileAssetById(fileId);

    if (!fileAsset) {
      return { ok: false, reason: 'not_found' };
    }

    const exists = await blobStorage.exists(fileAsset.storagePath);
    if (!exists) {
      return { ok: false, reason: 'blob_missing' };
    }

    return {
      ok: true,
      contentType: fileAsset.contentType,
      sha256: fileAsset.sha256,
      stream: blobStorage.openReadStream(fileAsset.storagePath),
    };
  },
});

/** Thin wrapper around {@link getFileAssetDownloadUseCase}. */
export async function getFileAssetDownload(
  store: ResourcePersistencePort,
  blobStorage: BlobStorage,
  fileId: string
): Promise<FileDownloadResult> {
  return getFileAssetDownloadUseCase.run({ resourcePersistence: store, blobStorage }, fileId);
}
