/**
 * @swagger
 * /api/admin/resources/{resourceId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a resource with versions
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceWithVersions'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     tags: [Admin]
 *     summary: Patch resource fields
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchResourceRequest'
 *     responses:
 *       200:
 *         description: Updated resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: No changes / invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a resource
 *     description: Hard-deletes the resource (and cascades versions/bindings). Also deletes any now-unreferenced file blobs from disk.
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { PatchResourceSchema } from '@/lib/types';
import { StorageService } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  const resource = await prisma.resource.findFirst({
    where: { id: params.resourceId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: {
          bindings: {
            include: { fileAsset: true },
          },
        },
      },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  const body = await request.json().catch(() => null);
  const parsed = PatchResourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.displayName === undefined) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  const updated = await prisma.resource.update({
    where: { id: params.resourceId },
    data: {
      ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: params.resourceId },
      select: { thumbnailFileAssetId: true },
    });

    // Collect candidate file assets (may be shared across resources/versions).
    const candidates = await prisma.fileAsset.findMany({
      where: {
        bindings: {
          some: {
            resourceVersion: {
              resourceId: params.resourceId,
            },
          },
        },
      },
      select: { id: true, storagePath: true },
    });

    if (resource?.thumbnailFileAssetId) {
      const thumb = await prisma.fileAsset.findUnique({
        where: { id: resource.thumbnailFileAssetId },
        select: { id: true, storagePath: true },
      });
      if (thumb) {
        candidates.push(thumb);
      }
    }

    const deleted = await prisma.resource.delete({
      where: { id: params.resourceId },
    });

    if (candidates.length > 0) {
      const candidateIds = Array.from(new Set(candidates.map((c) => c.id)));

      // Only delete blobs/rows that are now unreferenced.
      const orphans = await prisma.fileAsset.findMany({
        where: {
          id: { in: candidateIds },
          bindings: { none: {} },
          thumbnailForResources: { none: {} },
        },
        select: { id: true, storagePath: true },
      });

      for (const orphan of orphans) {
        await StorageService.deleteFile(orphan.storagePath);
        await prisma.fileAsset.delete({ where: { id: orphan.id } }).catch(() => null);
      }
    }

    return NextResponse.json(deleted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Prisma throws if record doesn't exist.
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
