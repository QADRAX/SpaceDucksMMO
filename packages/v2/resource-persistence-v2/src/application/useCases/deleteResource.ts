/**
 * @file Delete entire resource
 *
 * Deletes the resource row and attempts to delete file blobs that become unreferenced
 * (including optional thumbnail). Requires blob storage access.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type { DeleteResourceByIdInput } from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistenceFileDeps } from '../ports/resourcePersistenceDeps';

/**
 * Deletes a resource row and removes orphaned file blobs when no longer referenced.
 */
export const deleteResourceUseCase = defineResourceUseCase<
  ResourcePersistenceFileDeps,
  DeleteResourceByIdInput,
  unknown
>({
  name: 'deleteResource',
  async run(deps, input) {
    const { resourcePersistence: store, blobStorage } = deps;
    const { resourceId } = input;

    const thumbnailId = await store.findResourceThumbnailId(resourceId);

    let candidates = await store.findFileAssetsBoundToResource(resourceId);

    if (thumbnailId) {
      const thumb = await store.findFileAssetById(thumbnailId);
      if (thumb) {
        candidates = [...candidates, thumb];
      }
    }

    const deleted = await store.deleteResource(resourceId);

    if (candidates.length > 0) {
      const candidateIds = Array.from(new Set(candidates.map((c) => c.id)));

      const orphans = await store.findOrphanFileAssets(candidateIds);

      for (const orphan of orphans) {
        await blobStorage.delete(orphan.storagePath);
        await store.deleteFileAsset(orphan.id).catch(() => null);
      }
    }

    return deleted;
  },
});

/** Thin wrapper around {@link deleteResourceUseCase}. */
export async function deleteResource(deps: ResourcePersistenceFileDeps, resourceId: string) {
  return deleteResourceUseCase.run(deps, { resourceId });
}
