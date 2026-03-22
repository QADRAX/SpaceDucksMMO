/**
 * @file Create resource from zip bundle
 *
 * Reads `resource.json` from the zip, validates manifest and kind via the upload registry handler,
 * stores slot files in blob storage, writes bindings, and returns ids for the new resource and
 * version 1. Used by multipart flows when `zip` is present or by direct buffer import.
 */
import * as crypto from 'crypto';

import type { ResourceKind } from '@duckengine/core-v2';

import { defineResourceUseCase } from '../../domain/useCases';
import type {
  CreateResourceFromZipInput,
  CreateResourceFromZipResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import { collectSlotFilesFromZip } from '../../domain/zipSlotFiles';
import { ResourceKindSchema, ResourceZipManifestSchema } from '../../domain/validation/schemas';
import type { ResourcePersistenceUseCaseDeps } from '../ports/resourcePersistenceDeps';
import { parseZipJson } from '../ports/zipReader';

type CreateResourceFromZipDeps = Pick<
  ResourcePersistenceUseCaseDeps,
  'resourcePersistence' | 'blobStorage' | 'zipReader' | 'fileApiPathForFileId' | 'uploadRegistry'
>;

/**
 * Use case: zip import for new resource — initial version must be 1 per manifest rules.
 */
export const createResourceFromZipUseCase = defineResourceUseCase<
  CreateResourceFromZipDeps,
  CreateResourceFromZipInput,
  CreateResourceFromZipResult
>({
  name: 'createResourceFromZip',
  async run(deps, input) {
    const store = deps.resourcePersistence;
    const zipBuffer = input.zipBuffer;
    const files = deps.zipReader.readBasenameMap(zipBuffer);
    const manifestEntry = files.get('resource.json');
    if (!manifestEntry) {
      throw new Error('Missing resource.json in zip');
    }

    const manifestRaw = parseZipJson(manifestEntry, 'resource.json');
    const parsed = ResourceZipManifestSchema.safeParse(manifestRaw);
    if (!parsed.success) {
      throw new Error('Invalid resource.json manifest');
    }

    const kind = ResourceKindSchema.parse(parsed.data.kind) as ResourceKind;
    const versionPayload = parsed.data.version;

    if (versionPayload.version !== undefined && versionPayload.version !== 1) {
      throw new Error('Initial resource version must be 1');
    }

    if (versionPayload.componentType && versionPayload.componentType !== kind) {
      throw new Error('componentType must match resource kind');
    }

    const handler = deps.uploadRegistry.getHandler(kind);
    const component = handler.validateComponentData(kind, versionPayload.componentData);
    const slotFiles = collectSlotFilesFromZip(files, versionPayload.files);
    const profileMetadata = await Promise.resolve(handler.validateProfile(kind, slotFiles));

    const componentDataToStore: Record<string, unknown> = {
      ...component.componentData,
      ...profileMetadata,
    };

    const txResult = await store.transaction(async (tx) => {
      const resource = await tx.createResource({
        key: parsed.data.key,
        displayName: parsed.data.displayName,
        kind,
        activeVersion: 1,
      });

      const version = await tx.createResourceVersion({
        resourceId: resource.id,
        version: 1,
        componentType: component.componentType,
        componentData: JSON.stringify(componentDataToStore),
      });

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

      const bindingsMetadata = handler.processBindings(kind, resolvedBindings);
      Object.assign(componentDataToStore, bindingsMetadata);

      await tx.updateResourceVersion(version.id, {
        componentData: JSON.stringify(componentDataToStore),
      });

      return { resource, version };
    });

    return {
      resource: {
        id: txResult.resource.id,
        key: txResult.resource.key,
        kind: ResourceKindSchema.parse(txResult.resource.kind),
      },
      version: { id: txResult.version.id, version: txResult.version.version },
    };
  },
});
