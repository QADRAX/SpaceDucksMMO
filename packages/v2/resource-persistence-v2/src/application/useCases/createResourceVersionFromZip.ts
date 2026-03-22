/**
 * @file Append version from zip bundle
 *
 * Reads `version.json` (or nested manifest in `resource.json`), validates the next version number,
 * runs handler validation for the given kind, stores blobs and bindings, and updates active version.
 */
import * as crypto from 'crypto';

import { defineResourceUseCase } from '../../domain/useCases';
import type {
  CreateResourceVersionFromZipInput,
  CreateResourceVersionFromZipResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import { collectSlotFilesFromZip } from '../../domain/zipSlotFiles';
import { ResourceVersionZipManifestSchema } from '../../domain/validation/schemas';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';
import { parseZipJson } from '../ports/zipReader';

type CreateResourceVersionFromZipDeps = Pick<
  ResourcePersistenceUseCaseDeps,
  'resourcePersistence' | 'blobStorage' | 'zipReader' | 'fileApiPathForFileId' | 'uploadRegistry'
>;

/**
 * Use case: zip import for new version — enforces monotonic version and manifest consistency.
 */
export const createResourceVersionFromZipUseCase = defineResourceUseCase<
  CreateResourceVersionFromZipDeps,
  CreateResourceVersionFromZipInput,
  CreateResourceVersionFromZipResult
>({
  name: 'createResourceVersionFromZip',
  async run(deps, input) {
    const store = deps.resourcePersistence;
    const { resourceId, resourceKind, zipBuffer } = input;

    const files = deps.zipReader.readBasenameMap(zipBuffer);

    const manifestEntry = files.get('version.json') ?? files.get('resource.json');
    if (!manifestEntry) {
      throw new Error('Missing version.json in zip');
    }

    const manifestRaw = parseZipJson(manifestEntry, 'version.json');
    const parsed = ResourceVersionZipManifestSchema.safeParse(
      typeof manifestRaw === 'object' && manifestRaw && 'version' in (manifestRaw as object)
        ? (manifestRaw as { version: unknown }).version
        : manifestRaw
    );

    if (!parsed.success) {
      throw new Error('Invalid version.json manifest');
    }

    if (parsed.data.componentType && parsed.data.componentType !== resourceKind) {
      throw new Error('componentType must match resource kind');
    }

    const handler = deps.uploadRegistry.getHandler(resourceKind);
    const component = handler.validateComponentData(resourceKind, parsed.data.componentData);
    const slotFiles = collectSlotFilesFromZip(files, parsed.data.files);
    const profileMetadata = await Promise.resolve(handler.validateProfile(resourceKind, slotFiles));

    const componentDataToStore: Record<string, unknown> = {
      ...component.componentData,
      ...profileMetadata,
    };

    const created = await store.transaction(async (tx) => {
      const nextVersion = await (async () => {
        const last = await tx.findLastResourceVersionNumber(resourceId);
        const expected = (last || 0) + 1;

        if (parsed.data.version !== undefined) {
          if (parsed.data.version !== expected) {
            throw new Error(`version must be next incremental value (${expected})`);
          }
          return parsed.data.version;
        }

        return expected;
      })();

      const existing = await tx.findResourceVersionBare(resourceId, nextVersion);
      if (existing) {
        throw new Error(`Version ${nextVersion} already exists`);
      }

      const version = await tx.createResourceVersion({
        resourceId,
        version: nextVersion,
        componentType: component.componentType,
        componentData: JSON.stringify(componentDataToStore),
      });

      await tx.updateResource(resourceId, { activeVersion: nextVersion });

      const resolvedBindings: Array<{ slot: string; url: string }> = [];

      for (const slot of slotFiles) {
        const fileId = crypto.randomUUID();
        const contentType = deps.blobStorage.getContentTypeFromExtension(slot.fileName);

        const saved = await deps.blobStorage.put(slot.data, slot.fileName, {
          fileId,
          contentType,
        });

        const fileAsset = await tx.createFileAsset({
          id: fileId,
          fileName: saved.fileName,
          contentType: saved.contentType,
          size: saved.size,
          sha256: saved.sha256,
          storagePath: saved.storagePath,
        });

        await tx.createResourceBinding({
          resourceVersionId: version.id,
          slot: slot.slot,
          fileAssetId: fileAsset.id,
        });

        resolvedBindings.push({ slot: slot.slot, url: deps.fileApiPathForFileId(fileId) });
      }

      const bindingsMetadata = handler.processBindings(resourceKind, resolvedBindings);
      Object.assign(componentDataToStore, bindingsMetadata);

      await tx.updateResourceVersion(version.id, {
        componentData: JSON.stringify(componentDataToStore),
      });

      return version;
    });

    return created;
  },
});
