/**
 * @file List versions for one resource (wire JSON)
 *
 * Loads the resource with all versions from persistence and maps each version to the stable
 * JSON wire shape (`wireResourceVersionWithFiles`) for HTTP or other adapters.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  ListResourceVersionsInput,
  ListResourceVersionsResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';
import { wireResourceVersionWithFiles } from '../../domain/resourcePersistence/catalogWire';

type ListVerDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Use case: version list — returns `{ data, count }`; empty if resource id unknown.
 */
export const listResourceVersionsUseCase = defineResourceUseCase<
  ListVerDeps,
  ListResourceVersionsInput,
  ListResourceVersionsResult
>({
  name: 'listResourceVersions',
  async run(deps, input) {
    const resource = await deps.resourcePersistence.findResourceByIdWithVersions(input.resourceId);
    if (!resource) {
      return { data: [], count: 0 };
    }
    const data = resource.versions.map(wireResourceVersionWithFiles);
    return { data, count: data.length };
  },
});

/** Thin wrapper around {@link listResourceVersionsUseCase}. */
export async function listResourceVersions(
  store: ResourcePersistencePort,
  resourceId: string
): Promise<ListResourceVersionsResult> {
  return listResourceVersionsUseCase.run({ resourcePersistence: store }, { resourceId });
}
