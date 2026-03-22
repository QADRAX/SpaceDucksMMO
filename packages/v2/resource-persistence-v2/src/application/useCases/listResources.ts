/**
 * @file List catalog resources
 *
 * Returns persisted resource rows for the catalog, optionally filtered by a valid `ResourceKind`
 * string. Augments each row with `_count.versions` for list UIs.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  ListResourcesInput,
  ListResourcesResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import { ResourceKindSchema } from '../../domain/validation/schemas';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

type ListDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Use case: catalog listing — uses `listResourcesForCatalog` on the persistence port.
 */
export const listResourcesUseCase = defineResourceUseCase<
  ListDeps,
  ListResourcesInput,
  ListResourcesResult
>({
  name: 'listResources',
  async run(deps, input) {
    const kind =
      input.kindFilter && input.kindFilter.length
        ? ResourceKindSchema.safeParse(input.kindFilter)
        : null;

    const rows = await deps.resourcePersistence.listResourcesForCatalog({
      ...(kind?.success ? { kind: kind.data } : {}),
    });

    const data = rows.map(({ versionCount, ...rest }) => ({
      ...rest,
      _count: { versions: versionCount },
    }));

    return { data, count: data.length };
  },
});

/** Thin wrapper around {@link listResourcesUseCase}. */
export async function listResources(
  store: ResourcePersistencePort,
  kindFilter?: string | null
): Promise<ListResourcesResult> {
  return listResourcesUseCase.run({ resourcePersistence: store }, { kindFilter });
}
