/**
 * @file Delete one resource version (non-active)
 *
 * Removes a version row by number when it is not the only version and not the active pointer.
 * Deletes bound file blobs from storage when no other row references them.
 *
 * Requires blob + persistence deps (`ResourcePersistenceFileDeps`).
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  DeleteResourceVersionInput,
  DeleteResourceVersionResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistenceFileDeps } from '../ports/resourcePersistenceDeps';

/**
 * Use case: delete version — validates business rules (not last, not active) then prunes orphan blobs.
 */
export const deleteResourceVersionUseCase = defineResourceUseCase<
  ResourcePersistenceFileDeps,
  DeleteResourceVersionInput,
  DeleteResourceVersionResult
>({
  name: 'deleteResourceVersion',
  async run(deps, input) {
    const { resourcePersistence: store, blobStorage } = deps;
    const { resourceId, versionNumber } = input;

    const resource = await store.findResourceSummaryById(resourceId);
    if (!resource) {
      return { ok: false, status: 404, error: 'Resource not found' };
    }

    const existingVersion = await store.findResourceVersionId(resource.id, versionNumber);
    if (!existingVersion) {
      return { ok: false, status: 404, error: 'Version not found' };
    }

    const totalVersions = await store.countResourceVersions(resource.id);
    if (totalVersions <= 1) {
      return { ok: false, status: 400, error: 'Cannot delete the only version of a resource' };
    }
    if (resource.activeVersion === versionNumber) {
      return { ok: false, status: 400, error: 'Cannot delete the active version of a resource' };
    }

    try {
      const result = await store.transaction(async (tx) => {
        const candidates = await tx.findFileAssetsForVersion(existingVersion.id);

        await tx.deleteResourceVersionById(existingVersion.id);

        if (candidates.length) {
          const candidateIds = Array.from(new Set(candidates.map((c) => c.id)));
          const orphans = await tx.findOrphanFileAssets(candidateIds);

          for (const orphan of orphans) {
            await blobStorage.delete(orphan.storagePath);
            await tx.deleteFileAsset(orphan.id).catch(() => null);
          }
        }

        return { deletedVersionId: existingVersion.id };
      });

      return { ok: true, deleted: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, status: 400, error: message };
    }
  },
});

/** Thin wrapper around {@link deleteResourceVersionUseCase} for tests or direct port wiring. */
export async function deleteResourceVersion(
  deps: ResourcePersistenceFileDeps,
  resourceId: string,
  versionNumber: number
): Promise<DeleteResourceVersionResult> {
  return deleteResourceVersionUseCase.run(deps, { resourceId, versionNumber });
}
