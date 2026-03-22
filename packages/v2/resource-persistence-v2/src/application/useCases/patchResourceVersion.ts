/**
 * @file Patch one resource version
 *
 * Accepts `application/json` or `multipart/form-data`. Merges or replaces `componentData` per kind
 * (material, shader, mesh, etc.), uploads new slot files, updates bindings, and deletes orphaned
 * blobs when previous binding files are replaced.
 */
import * as crypto from 'crypto';

import { defineResourceUseCase } from '../../domain/useCases';
import { coerceComponentData, CUSTOM_SHADER_RESOURCE_KIND_SET } from '../../domain/componentPayload';
import { parseComponentDataJsonString } from '../../domain/componentJson';
import { MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES } from '../../domain/multipartMaterialTextureFieldNames';
import type {
  PatchResourceVersionInput,
  PatchResourceVersionResult,
} from '../../domain/resourcePersistence/useCaseTypes';
import {
  AnimationClipComponentDataSchema,
  EmptyStrictComponentDataSchema,
  MaterialComponentSchema,
  MaterialComponentTypeSchema,
  MeshComponentDataSchema,
  ShaderMaterialComponentDataSchema,
} from '../../domain/validation/schemas';
import type { ResourcePersistenceFileDeps } from '../ports/resourcePersistenceDeps';

async function runPatchResourceVersion(
  deps: ResourcePersistenceFileDeps,
  resourceId: string,
  versionNumber: number,
  contentType: string,
  bodyJson: unknown,
  formData: FormData | null
): Promise<PatchResourceVersionResult> {
  const { resourcePersistence: store, blobStorage, fileApiPathForFileId } = deps;

  const resource = await store.findResourceSelectKind(resourceId);

  if (!resource) {
    return { ok: false, status: 404, error: 'Resource not found' };
  }

  const existingVersion = await store.findResourceVersionBare(resourceId, versionNumber);

  if (!existingVersion) {
    return { ok: false, status: 404, error: 'Version not found' };
  }

  try {
    let componentDataObj: Record<string, unknown> | null = null;
    const uploadedFiles: Array<{ slot: string; file: File }> = [];

    if (contentType.includes('multipart/form-data') && formData) {
      const rawComponentData = formData.get('componentData');

      if (typeof rawComponentData === 'string' && rawComponentData.trim()) {
        try {
          const parsed = JSON.parse(rawComponentData) as unknown;
          componentDataObj = coerceComponentData(parsed);
        } catch {
          return { ok: false, status: 400, error: 'componentData must be valid JSON (or omitted)' };
        }
      } else {
        componentDataObj = null;
      }

      const reserved = new Set(['componentData']);
      for (const [slot, value] of formData.entries()) {
        if (reserved.has(slot)) continue;
        if (!(value instanceof File) || value.size === 0) continue;
        uploadedFiles.push({ slot, file: value });
      }
    } else if (contentType.includes('application/json')) {
      if (bodyJson && typeof bodyJson === 'object' && bodyJson !== null && 'componentData' in bodyJson) {
        componentDataObj = coerceComponentData((bodyJson as { componentData: unknown }).componentData);
      } else {
        componentDataObj = null;
      }
    } else {
      return {
        ok: false,
        status: 415,
        error: 'Unsupported content-type. Use application/json or multipart/form-data.',
      };
    }

    if (componentDataObj === null && uploadedFiles.length === 0) {
      return { ok: false, status: 400, error: 'No changes' };
    }

    const baseComponentData: Record<string, unknown> =
      componentDataObj ?? parseComponentDataJsonString(existingVersion.componentData);

    const kind = resource.kind;
    const materialKind = MaterialComponentTypeSchema.safeParse(kind);
    const isMaterial = materialKind.success;
    const isShader = CUSTOM_SHADER_RESOURCE_KIND_SET.has(kind);

    let componentDataToStore: Record<string, unknown>;

    if (isMaterial) {
      const componentPayloadParsed = MaterialComponentSchema.safeParse({
        componentType: materialKind.data,
        componentData: coerceComponentData(baseComponentData),
      });

      if (!componentPayloadParsed.success) {
        return { ok: false, status: 400, error: 'Invalid component data' };
      }

      componentDataToStore = {
        ...(componentPayloadParsed.data.componentData ?? {}),
      };
    } else if (isShader) {
      const parsed = ShaderMaterialComponentDataSchema.safeParse(coerceComponentData(baseComponentData));
      if (!parsed.success) {
        return { ok: false, status: 400, error: 'Invalid component data' };
      }
      componentDataToStore = parsed.data as Record<string, unknown>;
    } else if (kind === 'mesh') {
      const parsed = MeshComponentDataSchema.safeParse(coerceComponentData(baseComponentData));
      if (!parsed.success) {
        return { ok: false, status: 400, error: 'Invalid component data' };
      }
      componentDataToStore = { ...(parsed.data ?? {}) };
    } else if (kind === 'animationClip') {
      const parsed = AnimationClipComponentDataSchema.safeParse(coerceComponentData(baseComponentData));
      if (!parsed.success) {
        return { ok: false, status: 400, error: 'Invalid component data' };
      }
      componentDataToStore = { ...(parsed.data ?? {}) };
    } else if (kind === 'script' || kind === 'texture' || kind === 'skybox') {
      const parsed = EmptyStrictComponentDataSchema.safeParse(coerceComponentData(baseComponentData));
      if (!parsed.success) {
        return { ok: false, status: 400, error: 'Invalid component data' };
      }
      componentDataToStore = { ...(parsed.data ?? {}) };
    } else {
      return { ok: false, status: 400, error: `Unsupported resource kind: ${kind}` };
    }

    const updated = await store.transaction(async (tx) => {
      const orphanCandidateIds: string[] = [];

      for (const upload of uploadedFiles) {
        const fileId = crypto.randomUUID();
        const buf = Buffer.from(await upload.file.arrayBuffer());
        const saved = await blobStorage.put(buf, upload.file.name, {
          fileId,
          contentType: upload.file.type || undefined,
        });

        const fileAsset = await tx.createFileAsset({
          id: fileId,
          fileName: saved.fileName,
          contentType: saved.contentType,
          size: saved.size,
          sha256: saved.sha256,
          storagePath: saved.storagePath,
        });

        const existingBinding = await tx.findResourceBinding(existingVersion.id, upload.slot);

        if (existingBinding?.fileAssetId) {
          orphanCandidateIds.push(existingBinding.fileAssetId);
        }

        await tx.upsertResourceBinding(existingVersion.id, upload.slot, fileAsset.id);

        if (isMaterial && MULTIPART_MATERIAL_TEXTURE_FIELD_NAMES.has(upload.slot)) {
          const url = fileApiPathForFileId(fileId);
          if (upload.slot === 'albedo') {
            componentDataToStore.texture = url;
          } else {
            componentDataToStore[upload.slot] = url;
          }
        }
      }

      const versionUpdated = await tx.updateResourceVersion(existingVersion.id, {
        componentData: JSON.stringify(componentDataToStore),
      });

      if (orphanCandidateIds.length) {
        const uniqueIds = Array.from(new Set(orphanCandidateIds));
        const orphans = await tx.findOrphanFileAssets(uniqueIds);

        for (const orphan of orphans) {
          await blobStorage.delete(orphan.storagePath);
          await tx.deleteFileAsset(orphan.id).catch(() => null);
        }
      }

      return versionUpdated;
    });

    return { ok: true, version: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, status: 400, error: message };
  }
}

/**
 * Use case: patch version — discriminates by `Content-Type` and validates per resource kind.
 */
export const patchResourceVersionUseCase = defineResourceUseCase<
  ResourcePersistenceFileDeps,
  PatchResourceVersionInput,
  PatchResourceVersionResult
>({
  name: 'patchResourceVersion',
  async run(deps, input) {
    return runPatchResourceVersion(
      deps,
      input.resourceId,
      input.versionNumber,
      input.contentType,
      input.bodyJson,
      input.formData
    );
  },
});

/** Thin wrapper around {@link patchResourceVersionUseCase}. */
export async function patchResourceVersion(
  deps: ResourcePersistenceFileDeps,
  resourceId: string,
  versionNumber: number,
  contentType: string,
  bodyJson: unknown,
  formData: FormData | null
): Promise<PatchResourceVersionResult> {
  return runPatchResourceVersion(deps, resourceId, versionNumber, contentType, bodyJson, formData);
}
