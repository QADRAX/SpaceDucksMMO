/**
 * @file Create resource from JSON body
 *
 * Minimal catalog create: validates `CreateResourceSchema`, inserts resource + version 1 with empty
 * `{}` component payload. No file uploads — use multipart or zip use cases for assets.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  CreateResourceFromJsonInput,
  CreateResourceFromJsonResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import { CreateResourceSchema } from '../../domain/validation/schemas';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

type CreateJsonDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Use case: JSON-only create — returns `{ ok, status, error }` on validation or transaction failure.
 */
export const createResourceFromJsonUseCase = defineResourceUseCase<
  CreateJsonDeps,
  CreateResourceFromJsonInput,
  CreateResourceFromJsonResult
>({
  name: 'createResourceFromJson',
  async run(deps, input) {
    const store = deps.resourcePersistence;
    const parsed = CreateResourceSchema.safeParse(input.body);

    if (!parsed.success) {
      return { ok: false, status: 400, error: 'Invalid payload' };
    }

    try {
      const created = await store.transaction(async (tx) => {
        const resource = await tx.createResource({
          key: parsed.data.key,
          displayName: parsed.data.displayName,
          kind: parsed.data.kind,
          activeVersion: 1,
        });

        await tx.createResourceVersion({
          resourceId: resource.id,
          version: 1,
          componentType: resource.kind,
          componentData: '{}',
        });

        return resource;
      });

      return { ok: true, resource: created };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, status: 500, error: message };
    }
  },
});

/** Thin wrapper around {@link createResourceFromJsonUseCase}. */
export async function createResourceFromJson(
  store: ResourcePersistencePort,
  body: unknown
): Promise<CreateResourceFromJsonResult> {
  return createResourceFromJsonUseCase.run({ resourcePersistence: store }, { body });
}
