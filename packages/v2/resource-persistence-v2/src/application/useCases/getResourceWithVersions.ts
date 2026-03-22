/**
 * @file Get resource with full version history
 *
 * Loads one resource by id including all versions and file bindings (domain `ResourceWithVersionHistory`).
 * Does not apply HTTP wire mapping — callers that need JSON use the catalog wire helpers.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type { ResourceWithVersionHistory } from '../../domain/engineResource';
import type { GetResourceWithVersionsInput } from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

type GetDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Use case: detail read — `null` if id not found.
 */
export const getResourceWithVersionsUseCase = defineResourceUseCase<
  GetDeps,
  GetResourceWithVersionsInput,
  ResourceWithVersionHistory | null
>({
  name: 'getResourceWithVersions',
  async run(deps, input) {
    return deps.resourcePersistence.findResourceByIdWithVersions(input.resourceId);
  },
});

/** Thin wrapper around {@link getResourceWithVersionsUseCase}. */
export async function getResourceWithVersions(
  store: ResourcePersistencePort,
  resourceId: string
): Promise<ResourceWithVersionHistory | null> {
  return getResourceWithVersionsUseCase.run({ resourcePersistence: store }, { resourceId });
}
