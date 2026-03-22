/**
 * @file Set active version pointer
 *
 * Updates which version number is considered “active” for a resource without uploading files.
 * Validates that the version exists; returns refreshed catalog row on success.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  SetResourceActiveVersionInput,
  SetResourceActiveVersionResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

type SetActiveDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Points the catalog’s active version to an existing version number.
 */
export const setResourceActiveVersionUseCase = defineResourceUseCase<
  SetActiveDeps,
  SetResourceActiveVersionInput,
  SetResourceActiveVersionResult
>({
  name: 'setResourceActiveVersion',
  async run(deps, input) {
    const store = deps.resourcePersistence;
    const { resourceId, versionNumber } = input;

    if (!Number.isFinite(versionNumber) || versionNumber <= 0 || !Number.isInteger(versionNumber)) {
      return { ok: false, status: 400, error: 'Invalid version' };
    }

    const resource = await store.findResourceSummaryById(resourceId);
    if (!resource) {
      return { ok: false, status: 404, error: 'Resource not found' };
    }

    const existing = await store.findResourceVersionId(resource.id, versionNumber);

    if (!existing) {
      return { ok: false, status: 404, error: 'Version not found' };
    }

    await store.updateResourceActiveVersion(resource.id, versionNumber);

    const refreshed = await store.findResourceById(resource.id);
    return { ok: true, resource: refreshed ?? resource };
  },
});

/** Thin wrapper around {@link setResourceActiveVersionUseCase}. */
export async function setResourceActiveVersion(
  store: ResourcePersistencePort,
  resourceId: string,
  versionNumber: number
): Promise<SetResourceActiveVersionResult> {
  return setResourceActiveVersionUseCase.run({ resourcePersistence: store }, { resourceId, versionNumber });
}
