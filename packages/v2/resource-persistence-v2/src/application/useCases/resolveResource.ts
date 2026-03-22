/**
 * @file Resolve resource by key (engine runtime)
 *
 * Looks up a catalog resource by stable key, selects a version (`active`, `latest`, or numeric),
 * parses `componentData` JSON, and builds the `files` map with public URLs via `publicUrls`.
 * Output matches the engine loader contract (`ResolvedResourcePayload`).
 */
import type { ResourceData, ResourceKind } from '@duckengine/core-v2';

import { defineResourceUseCase } from '../../domain/useCases';
import { parseComponentDataJsonString } from '../../domain/componentJson';
import type {
  ResolvedResourcePayload,
  ResolveResourceParams,
} from '../../domain/resourcePersistence/useCaseTypes';
import { ResourceKindSchema } from '../../domain/validation/schemas';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';
import type { PublicUrlResolver } from '../ports/publicUrl';
import type { ResourcePersistencePort } from '../ports/resourcePersistence';

type ResolveResourceDeps = Pick<ResourcePersistenceUseCaseDeps, 'resourcePersistence' | 'publicUrls'>;

/**
 * Resolves a catalog resource by key to the engine-facing payload (component data + file URLs).
 */
export const resolveResourceUseCase = defineResourceUseCase<
  ResolveResourceDeps,
  ResolveResourceParams,
  ResolvedResourcePayload | null
>({
  name: 'resolveResource',
  async run(deps, params) {
    const { key, version: versionParam } = params;
    const store = deps.resourcePersistence;
    const publicUrls = deps.publicUrls;

    const resource = await store.findResourceSummaryByKey(key);

    if (!resource) return null;

    const selectedVersion = await (async () => {
      const selector = versionParam ?? 'active';

      if (selector === 'active' || selector === 'default') {
        const active = await store.findResourceVersionWithBindings(resource.id, resource.activeVersion);
        if (active) return active;

        return await store.findLatestResourceVersion(resource.id);
      }

      if (selector === 'latest') {
        return await store.findLatestResourceVersion(resource.id);
      }

      const parsed = Number(selector);
      if (!Number.isFinite(parsed) || parsed <= 0) return null;

      return await store.findResourceVersionWithBindings(resource.id, parsed);
    })();

    if (!selectedVersion) return null;

    const componentType = ResourceKindSchema.parse(selectedVersion.componentType);
    const rawComponent = parseComponentDataJsonString(selectedVersion.componentData);
    const componentData = rawComponent as ResourceData<ResourceKind>;

    const files: ResolvedResourcePayload['files'] = {};

    for (const binding of selectedVersion.bindings) {
      const blob = binding.file;
      files[binding.slot] = {
        id: blob.id,
        fileName: blob.fileName,
        contentType: blob.contentType,
        size: blob.size,
        sha256: blob.sha256,
        url: publicUrls.fileUrlForFileId(blob.id),
      };
    }

    return {
      key: resource.key,
      resourceId: resource.id,
      version: selectedVersion.version,
      componentType,
      componentData,
      files,
    };
  },
});

/** Thin wrapper: persistence + public URL resolver only (no full `ResourcePersistenceUseCaseDeps`). */
export async function resolveResource(
  store: ResourcePersistencePort,
  publicUrls: PublicUrlResolver,
  params: ResolveResourceParams
): Promise<ResolvedResourcePayload | null> {
  return resolveResourceUseCase.run({ resourcePersistence: store, publicUrls }, params);
}
