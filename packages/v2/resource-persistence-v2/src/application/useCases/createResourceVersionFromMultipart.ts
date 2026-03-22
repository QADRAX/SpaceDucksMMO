/**
 * @file Append resource version from multipart
 *
 * Accepts `multipart/form-data` for an existing resource: either a `zip` field (delegates to
 * {@link createResourceVersionFromZipUseCase}) or field-based slots per kind (materials, mesh,
 * shader sources, etc.). Validates component JSON, stores new blobs, creates bindings, and bumps
 * the active version to the new version number.
 */
import * as crypto from 'crypto';

import { defineResourceUseCase } from '../../domain/useCases';
import { parseComponentPayloadForKind } from '../../domain/componentPayload';
import type { CreateResourceVersionFromMultipartInput } from '../../domain/resourcePersistence/useCaseTypes';
import { MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES } from '../../domain/multipartMaterialTextureFieldNames';
import { assertMultipartFormHasRequiredFiles } from '../../domain/multipartSlots';
import {
  CreateResourceVersionSchema,
  MaterialComponentTypeSchema,
  ResourceKindSchema,
} from '../../domain/validation/schemas';
import type { ResourcePersistenceFileDeps } from '../ports/resourcePersistenceDeps';
import { createResourceVersionFromZipUseCase } from './createResourceVersionFromZip';

async function runCreateResourceVersionFromMultipart(
  deps: ResourcePersistenceFileDeps,
  resourceId: string,
  formData: FormData
): Promise<unknown> {
  const { resourcePersistence: store, blobStorage, fileApiPathForFileId, zipReader } = deps;

  const resource = await store.findResourceById(resourceId);

  if (!resource) {
    throw new Error('Resource not found');
  }

  const zip = formData.get('zip');
  if (zip instanceof File && zip.size > 0) {
    const buf = Buffer.from(await zip.arrayBuffer());
    const resourceKind = ResourceKindSchema.parse(resource.kind);
    return createResourceVersionFromZipUseCase.run(
      {
        resourcePersistence: deps.resourcePersistence,
        blobStorage,
        zipReader,
        fileApiPathForFileId,
        uploadRegistry: deps.uploadRegistry,
      },
      { resourceId: resource.id, resourceKind, zipBuffer: buf }
    );
  }

  const rawVersion = formData.get('version');
  const rawComponentData = formData.get('componentData');
  const rawComponentType = formData.get('componentType');

  const parsed = CreateResourceVersionSchema.safeParse({
    version:
      typeof rawVersion === 'string' && rawVersion.length ? Number(rawVersion) : undefined,
    componentData: rawComponentData,
    componentType: typeof rawComponentType === 'string' ? rawComponentType : undefined,
  });

  if (!parsed.success) {
    throw new Error('Invalid payload');
  }

  if (parsed.data.componentType && parsed.data.componentType !== resource.kind) {
    throw new Error('componentType must match resource kind');
  }

  const componentDataObj = (() => {
    if (typeof rawComponentData !== 'string' || !rawComponentData.trim()) return {};
    try {
      return JSON.parse(rawComponentData) as unknown;
    } catch {
      return null;
    }
  })();

  if (componentDataObj === null) {
    throw new Error('componentData must be valid JSON (or omitted)');
  }

  const kind = ResourceKindSchema.parse(resource.kind);

  const componentPayloadParsed = parseComponentPayloadForKind(kind, componentDataObj);

  if (!componentPayloadParsed.success) {
    throw new Error('Invalid component data');
  }

  assertMultipartFormHasRequiredFiles(kind, formData);

  const nextVersion = await (async () => {
    const last = await store.findLastResourceVersionNumber(resource.id);
    const expected = (last || 0) + 1;

    if (parsed.data.version !== undefined) {
      if (parsed.data.version !== expected) {
        throw new Error(`version must be next incremental value (${expected})`);
      }
      return parsed.data.version;
    }

    return expected;
  })();

  const existing = await store.findResourceVersionBare(resource.id, nextVersion);

  if (existing) {
    throw new Error(`Version ${nextVersion} already exists`);
  }

  const created = await store.transaction(async (tx) => {
    const componentDataToStore: Record<string, unknown> = {
      ...((componentPayloadParsed as { data?: { componentData?: Record<string, unknown> } }).data
        ?.componentData ?? {}),
    };

    const version = await tx.createResourceVersion({
      resourceId: resource.id,
      version: nextVersion,
      componentType: resource.kind,
      componentData: JSON.stringify(componentDataToStore),
    });

    const reserved = new Set([
      'zip',
      'version',
      'status',
      'isDefault',
      'componentData',
      'componentType',
    ]);
    const seenSlots = new Set<string>();

    for (const [key, value] of formData.entries()) {
      if (reserved.has(key)) continue;
      if (!(value instanceof File) || value.size === 0) continue;

      if (seenSlots.has(key)) {
        throw new Error(`Duplicate file field for slot: ${key}`);
      }
      seenSlots.add(key);

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
        slot: key,
        fileAssetId: fileAsset.id,
      });

      if (MaterialComponentTypeSchema.safeParse(kind).success) {
        if (MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES.has(key)) {
          const url = fileApiPathForFileId(fileId);
          if (key === 'albedo') {
            componentDataToStore.texture = url;
          } else {
            componentDataToStore[key] = url;
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

    await tx.updateResource(resource.id, { activeVersion: nextVersion });

    return version;
  });

  return created;
}

/**
 * Use case: new version from multipart — zip path or per-slot uploads with kind-specific rules.
 */
export const createResourceVersionFromMultipartUseCase = defineResourceUseCase<
  ResourcePersistenceFileDeps,
  CreateResourceVersionFromMultipartInput,
  unknown
>({
  name: 'createResourceVersionFromMultipart',
  async run(deps, input) {
    return runCreateResourceVersionFromMultipart(deps, input.resourceId, input.formData);
  },
});

/** Thin wrapper around {@link createResourceVersionFromMultipartUseCase}. */
export async function createResourceVersionFromMultipart(
  deps: ResourcePersistenceFileDeps,
  resourceId: string,
  formData: FormData
): Promise<unknown> {
  return runCreateResourceVersionFromMultipart(deps, resourceId, formData);
}
