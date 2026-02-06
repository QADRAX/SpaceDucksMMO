import * as crypto from 'crypto';

import type { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

import { StorageService } from '@/lib/storage';
import { MATERIAL_RESOURCE_KINDS } from '@/lib/types';

const MATERIAL_THUMBNAIL_SLOTS = [
  // Preferred naming
  'baseColor',
  'albedo',
  // Common legacy naming
  'texture',
  'diffuse',
  'color',
] as const;

function normalizeSlot(slot: string): string {
  return slot.trim().toLowerCase();
}

function pickMaterialThumbnailFile(
  bindings: Array<{ slot: string; fileAsset: { contentType: string; storagePath: string } }>
) {
  const bySlot = new Map<string, (typeof bindings)[number]>();
  for (const b of bindings) {
    bySlot.set(normalizeSlot(b.slot), b);
  }

  for (const preferred of MATERIAL_THUMBNAIL_SLOTS) {
    const hit = bySlot.get(normalizeSlot(preferred));
    if (hit) return hit.fileAsset;
  }

  // Fallback: first image binding.
  for (const b of bindings) {
    if (b.fileAsset.contentType.startsWith('image/')) return b.fileAsset;
  }

  return null;
}

async function renderThumbnailJpeg(source: Buffer): Promise<Buffer> {
  return await sharp(source)
    .resize(200, 200, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function deleteFileAssetIfOrphan(prisma: PrismaClient, fileAssetId: string) {
  const orphan = await prisma.fileAsset.findFirst({
    where: {
      id: fileAssetId,
      bindings: { none: {} },
      thumbnailForResources: { none: {} },
    },
    select: { id: true, storagePath: true },
  });

  if (!orphan) return;

  await StorageService.deleteFile(orphan.storagePath);
  await prisma.fileAsset.delete({ where: { id: orphan.id } }).catch(() => null);
}

/**
 * Regenerate a Resource thumbnail from a specific version.
 *
 * For materials: uses baseColor/albedo/texture binding (first match).
 * Best-effort: if there is no usable image binding, it leaves the thumbnail unchanged.
 */
export async function updateResourceThumbnailFromVersion(
  prisma: PrismaClient,
  resourceId: string,
  versionNumber: number
): Promise<void> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      kind: true,
      thumbnailFileAssetId: true,
    },
  });

  if (!resource) return;

  const version = await prisma.resourceVersion.findUnique({
    where: {
      resourceId_version: {
        resourceId: resource.id,
        version: versionNumber,
      },
    },
    include: {
      bindings: {
        include: {
          fileAsset: {
            select: {
              contentType: true,
              storagePath: true,
            },
          },
        },
      },
    },
  });

  if (!version) return;

  const isMaterial = (MATERIAL_RESOURCE_KINDS as readonly string[]).includes(resource.kind);
  if (!isMaterial) return;

  const mainFile = pickMaterialThumbnailFile(
    version.bindings.map((b) => ({
      slot: b.slot,
      fileAsset: { contentType: b.fileAsset.contentType, storagePath: b.fileAsset.storagePath },
    }))
  );

  if (!mainFile) return;
  if (!mainFile.contentType.startsWith('image/')) return;

  const previousThumbnailId = resource.thumbnailFileAssetId;

  const source = await StorageService.readFile(mainFile.storagePath);
  const thumb = await renderThumbnailJpeg(source);

  const thumbId = crypto.randomUUID();
  const saved = await StorageService.saveFile(thumb, 'thumbnail.jpg', {
    fileId: thumbId,
    contentType: 'image/jpeg',
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.fileAsset.create({
        data: {
          id: thumbId,
          fileName: saved.fileName,
          contentType: saved.contentType,
          size: saved.size,
          sha256: saved.sha256,
          storagePath: saved.storagePath,
        },
      });

      await tx.resource.update({
        where: { id: resource.id },
        data: { thumbnailFileAssetId: thumbId },
      });
    });
  } catch (error) {
    // If DB write fails, best-effort cleanup the blob.
    await StorageService.deleteFile(saved.storagePath);
    throw error;
  }

  if (previousThumbnailId) {
    await deleteFileAssetIfOrphan(prisma, previousThumbnailId);
  }
}
