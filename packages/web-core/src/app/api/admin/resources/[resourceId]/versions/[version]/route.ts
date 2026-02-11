/**
 * @swagger
 * /api/admin/resources/{resourceId}/versions/{version}:
 *   patch:
 *     tags: [Admin]
 *     summary: Patch a specific resource version
 *     description: Updates componentData and optionally replaces/creates file bindings via multipart upload.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               componentData:
 *                 description: Object with component properties
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               componentData:
 *                 type: string
 *                 description: JSON string
 *     responses:
 *       200:
 *         description: Updated version
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a specific resource version
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted version
 *       400:
 *         description: Cannot delete
 *       404:
 *         description: Not found
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

import { prisma } from '@/lib/db';
import { MaterialComponentSchema } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';

function coerceComponentData(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

function parseVersionParam(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string; version: string }> }
) {
  const { resourceId, version: versionRaw } = await context.params;
  const versionNumber = parseVersionParam(versionRaw);
  if (!versionNumber) {
    return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, kind: true },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const existingVersion = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: versionNumber } },
    include: { bindings: true },
  });

  if (!existingVersion) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') || '';
  const supportedTextureFields = new Set([
    'texture',
    'normalMap',
    'envMap',
    'aoMap',
    'roughnessMap',
    'metalnessMap',
    'specularMap',
    'bumpMap',
    'baseColor',
    'albedo',
  ]);

  try {
    let componentDataObj: Record<string, unknown> | null = null;
    const uploadedFiles: Array<{ slot: string; file: File }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawComponentData = formData.get('componentData');

      if (typeof rawComponentData === 'string' && rawComponentData.trim()) {
        try {
          const parsed = JSON.parse(rawComponentData);
          componentDataObj = coerceComponentData(parsed);
        } catch {
          return NextResponse.json(
            { error: 'componentData must be valid JSON (or omitted)' },
            { status: 400 }
          );
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
      const body = await request.json().catch(() => null);
      if (body && typeof body === 'object' && 'componentData' in (body as any)) {
        componentDataObj = coerceComponentData((body as any).componentData);
      } else {
        componentDataObj = null;
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content-type. Use application/json or multipart/form-data.' },
        { status: 415 }
      );
    }

    if (componentDataObj === null && uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'No changes' }, { status: 400 });
    }

    const baseComponentData: Record<string, unknown> = componentDataObj ?? (() => {
      try {
        return coerceComponentData(JSON.parse(existingVersion.componentData ?? '{}'));
      } catch {
        return {};
      }
    })();

    const componentPayloadParsed = MaterialComponentSchema.safeParse({
      componentType: resource.kind as any,
      componentData: coerceComponentData(baseComponentData),
    });

    if (!componentPayloadParsed.success) {
      return NextResponse.json(
        { error: 'Invalid component data', details: componentPayloadParsed.error.flatten() },
        { status: 400 }
      );
    }

    const componentDataToStore: Record<string, unknown> = {
      ...(componentPayloadParsed.data.componentData ?? {}),
    };

    const updated = await prisma.$transaction(async (tx) => {
      // Track potentially orphaned file assets after replacing bindings.
      const orphanCandidateIds: string[] = [];

      for (const upload of uploadedFiles) {
        const fileId = crypto.randomUUID();
        const saved = await StorageService.saveFile(upload.file, upload.file.name, {
          fileId,
          contentType: upload.file.type || undefined,
        });

        const fileAsset = await tx.fileAsset.create({
          data: {
            id: fileId,
            fileName: saved.fileName,
            contentType: saved.contentType,
            size: saved.size,
            sha256: saved.sha256,
            storagePath: saved.storagePath,
          },
        });

        const existingBinding = await tx.resourceBinding.findUnique({
          where: { resourceVersionId_slot: { resourceVersionId: existingVersion.id, slot: upload.slot } },
          select: { fileAssetId: true },
        });

        if (existingBinding?.fileAssetId) {
          orphanCandidateIds.push(existingBinding.fileAssetId);
        }

        await tx.resourceBinding.upsert({
          where: { resourceVersionId_slot: { resourceVersionId: existingVersion.id, slot: upload.slot } },
          create: {
            resourceVersionId: existingVersion.id,
            slot: upload.slot,
            fileAssetId: fileAsset.id,
          },
          update: {
            fileAssetId: fileAsset.id,
          },
        });

        if (supportedTextureFields.has(upload.slot)) {
          const url = `/api/files/${fileId}`;
          if (upload.slot === 'baseColor' || upload.slot === 'albedo') {
            componentDataToStore.texture = url;
          } else {
            componentDataToStore[upload.slot] = url;
          }
        }
      }

      const versionUpdated = await tx.resourceVersion.update({
        where: { id: existingVersion.id },
        data: {
          componentData: JSON.stringify(componentDataToStore),
        },
      });

      if (orphanCandidateIds.length) {
        const uniqueIds = Array.from(new Set(orphanCandidateIds));
        const orphans = await tx.fileAsset.findMany({
          where: {
            id: { in: uniqueIds },
            bindings: { none: {} },
            thumbnailForResources: { none: {} },
          },
          select: { id: true, storagePath: true },
        });

        for (const orphan of orphans) {
          await StorageService.deleteFile(orphan.storagePath);
          await tx.fileAsset.delete({ where: { id: orphan.id } }).catch(() => null);
        }
      }

      return versionUpdated;
    });

    // Best-effort thumbnail regen for this version.
    try {
      await updateResourceThumbnailFromVersion(prisma, resource.id, versionNumber);
    } catch {
      // ignore
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string; version: string }> }
) {
  const { resourceId, version: versionRaw } = await context.params;
  const versionNumber = parseVersionParam(versionRaw);
  if (!versionNumber) {
    return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, activeVersion: true },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const existingVersion = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: versionNumber } },
    select: { id: true },
  });

  if (!existingVersion) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  // Invariants:
  // - You cannot delete the active version (it is in use).
  // - You cannot delete the only remaining version.
  const totalVersions = await prisma.resourceVersion.count({
    where: { resourceId: resource.id },
  });
  if (totalVersions <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete the only version of a resource' },
      { status: 400 }
    );
  }
  if (resource.activeVersion === versionNumber) {
    return NextResponse.json(
      { error: 'Cannot delete the active version of a resource' },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const candidates = await tx.fileAsset.findMany({
        where: {
          bindings: {
            some: { resourceVersionId: existingVersion.id },
          },
        },
        select: { id: true, storagePath: true },
      });

      const deleted = await tx.resourceVersion.delete({
        where: { id: existingVersion.id },
      });

      if (candidates.length) {
        const candidateIds = Array.from(new Set(candidates.map((c) => c.id)));
        const orphans = await tx.fileAsset.findMany({
          where: {
            id: { in: candidateIds },
            bindings: { none: {} },
            thumbnailForResources: { none: {} },
          },
          select: { id: true, storagePath: true },
        });

        for (const orphan of orphans) {
          await StorageService.deleteFile(orphan.storagePath);
          await tx.fileAsset.delete({ where: { id: orphan.id } }).catch(() => null);
        }
      }

      return deleted;
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
