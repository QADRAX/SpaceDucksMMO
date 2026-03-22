/**
 * @file Patch resource metadata
 *
 * Updates catalog fields on a resource (display name, key, active version pointer) from a JSON
 * body validated with `PatchResourceSchema`. Returns HTTP-style `{ ok, status, error }` on failure.
 */
import { defineResourceUseCase } from '../../domain/useCases';
import type {
  PatchResourceMetadataInput,
  PatchResourceMetadataResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import { PatchResourceSchema } from '../../domain/validation/schemas';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';

type PatchDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence'>;

/**
 * Updates catalog metadata for a resource (display name, key, active version pointer).
 */
export const patchResourceUseCase = defineResourceUseCase<
  PatchDeps,
  PatchResourceMetadataInput,
  PatchResourceMetadataResult
>({
  name: 'patchResource',
  async run(deps, input) {
    const store = deps.resourcePersistence;
    const parsed = PatchResourceSchema.safeParse(input.body);

    if (!parsed.success) {
      return { ok: false, status: 400, error: 'Invalid payload' };
    }

    if (
      parsed.data.displayName === undefined &&
      parsed.data.key === undefined &&
      parsed.data.activeVersion === undefined
    ) {
      return { ok: false, status: 400, error: 'No changes' };
    }

    if (parsed.data.activeVersion !== undefined) {
      const exists = await store.findResourceVersionId(input.resourceId, parsed.data.activeVersion);

      if (!exists) {
        return {
          ok: false,
          status: 400,
          error: `Version ${parsed.data.activeVersion} does not exist for this resource`,
        };
      }
    }

    try {
      const updated = await store.updateResource(input.resourceId, {
        ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
        ...(parsed.data.key !== undefined ? { key: parsed.data.key } : {}),
        ...(parsed.data.activeVersion !== undefined ? { activeVersion: parsed.data.activeVersion } : {}),
      });

      return { ok: true, resource: updated };
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err && err.code === 'P2002') {
        return { ok: false, status: 409, error: 'Resource key already exists' };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { ok: false, status: 400, error: message };
    }
  },
});

/** Thin wrapper around {@link patchResourceUseCase}. */
export async function patchResource(
  store: ResourcePersistencePort,
  resourceId: string,
  body: unknown
): Promise<PatchResourceMetadataResult> {
  return patchResourceUseCase.run({ resourcePersistence: store }, { resourceId, body });
}
