/**
 * @file Create resource from multipart
 *
 * Handles `multipart/form-data` for a **new** resource: if a non-empty `zip` is present, delegates
 * to {@link createResourceFromZipUseCase}; otherwise parses fields + `componentData` JSON, validates
 * per kind, uploads slot files to blob storage, and creates version 1 with bindings.
 */
import * as crypto from 'crypto';

import { defineResourceUseCase } from '../../domain/useCases';
import { parseComponentPayloadForKind } from '../../domain/componentPayload';
import type { CreateResourceFromMultipartResult } from '../../domain/resourcePersistence/useCaseTypes';
import { MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES } from '../../domain/multipartMaterialTextureFieldNames';
import { assertMultipartFormHasRequiredFiles } from '../../domain/multipartSlots';
import { CreateResourceSchema, MaterialComponentTypeSchema } from '../../domain/validation/schemas';
import type { ResourcePersistenceFileDeps } from '../ports/resourcePersistenceDeps';
import { createResourceFromZipUseCase } from './createResourceFromZip';

async function createResourceFromMultipartNonZip(
  deps: ResourcePersistenceFileDeps,
  formData: FormData
): Promise<CreateResourceFromMultipartResult> {
  const { resourcePersistence: store, blobStorage, fileApiPathForFileId } = deps;

  const key = formData.get('key');
  const displayName = formData.get('displayName');
  const kindRaw = formData.get('kind');
  const componentDataRaw = formData.get('componentData');

  const parsedCreate = CreateResourceSchema.safeParse({
    key,
    displayName,
    kind: kindRaw,
  });

  if (!parsedCreate.success) {
    throw new Error('Invalid payload');
  }

  const componentDataObj = (() => {
    if (typeof componentDataRaw !== 'string' || !componentDataRaw.trim()) return {};
    try {
      return JSON.parse(componentDataRaw) as unknown;
    } catch {
      return null;
    }
  })();

  if (componentDataObj === null) {
    throw new Error('componentData must be valid JSON (or omitted)');
  }

  const kind = parsedCreate.data.kind;

  const componentPayloadParsed = parseComponentPayloadForKind(kind, componentDataObj);

  if (!componentPayloadParsed.success) {
    throw new Error('Invalid component data');
  }

  assertMultipartFormHasRequiredFiles(kind, formData);

  const created = await store.transaction(async (tx) => {
    const resource = await tx.createResource({
      key: parsedCreate.data.key,
      displayName: parsedCreate.data.displayName,
      kind: parsedCreate.data.kind,
      activeVersion: 1,
    });

    const componentDataToStore: Record<string, unknown> = {
      ...((componentPayloadParsed as { data?: { componentData?: Record<string, unknown> } }).data
        ?.componentData ?? {}),
    };

    const version = await tx.createResourceVersion({
      resourceId: resource.id,
      version: 1,
      componentType: resource.kind,
      componentData: JSON.stringify(componentDataToStore),
    });

    const reserved = new Set(['zip', 'key', 'displayName', 'kind', 'componentData', 'componentType']);
    const seenSlots = new Set<string>();

    for (const [slot, value] of formData.entries()) {
      if (reserved.has(slot)) continue;
      if (!(value instanceof File) || value.size === 0) continue;

      if (seenSlots.has(slot)) {
        throw new Error(`Duplicate file field for slot: ${slot}`);
      }
      seenSlots.add(slot);

      const fileId = crypto.randomUUID();
      const buf = Buffer.from(await value.arrayBuffer());
      const saved = await blobStorage.put(buf, value.name, {
        fileId,
        contentType: value.type || undefined,
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
        slot,
        fileAssetId: fileAsset.id,
      });

      if (MaterialComponentTypeSchema.safeParse(kind).success) {
        if (MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES.has(slot)) {
          const url = fileApiPathForFileId(fileId);
          if (slot === 'albedo') {
            componentDataToStore.texture = url;
          } else {
            componentDataToStore[slot] = url;
          }
        }
      }
    }

    if (kind === 'mesh') {
      if (!seenSlots.has('geometry')) {
        throw new Error("mesh requires a 'geometry' file field");
      }
      for (const s of seenSlots) {
        const sl = s.toLowerCase();
        if (sl !== 'geometry' && sl !== 'thumbnail') {
          throw new Error(`mesh: unknown file slot ${s}`);
        }
      }
    }

    await tx.updateResourceVersion(version.id, {
      componentData: JSON.stringify(componentDataToStore),
    });

    return { resource, version };
  });

  return created;
}

async function runCreateResourceFromMultipart(
  deps: ResourcePersistenceFileDeps,
  formData: FormData
): Promise<CreateResourceFromMultipartResult> {
  const zip = formData.get('zip');
  if (zip instanceof File && zip.size > 0) {
    const buf = Buffer.from(await zip.arrayBuffer());
    return createResourceFromZipUseCase.run(
      {
        resourcePersistence: deps.resourcePersistence,
        blobStorage: deps.blobStorage,
        zipReader: deps.zipReader,
        fileApiPathForFileId: deps.fileApiPathForFileId,
        uploadRegistry: deps.uploadRegistry,
      },
      { zipBuffer: buf }
    );
  }

  return createResourceFromMultipartNonZip(deps, formData);
}

/**
 * Use case: multipart create — zip or manual slots; throws on invalid payload/component data.
 */
export const createResourceFromMultipartUseCase = defineResourceUseCase<
  ResourcePersistenceFileDeps,
  FormData,
  CreateResourceFromMultipartResult
>({
  name: 'createResourceFromMultipart',
  run: runCreateResourceFromMultipart,
});

/** Thin wrapper around {@link createResourceFromMultipartUseCase}. */
export async function createResourceFromMultipart(
  deps: ResourcePersistenceFileDeps,
  formData: FormData
): Promise<CreateResourceFromMultipartResult> {
  return runCreateResourceFromMultipart(deps, formData);
}
