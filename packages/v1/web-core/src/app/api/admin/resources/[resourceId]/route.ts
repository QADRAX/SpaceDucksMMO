/**
 * @swagger
 * /api/admin/resources/{resourceId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a resource with versions
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   patch:
 *     tags: [Admin]
 *     summary: Patch resource fields
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a resource
 *     description: Hard-deletes the resource (and cascades versions/bindings). Also deletes any now-unreferenced file blobs from disk.
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { PatchResourceSchema } from '@/lib/types';
import { StorageService } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId },
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
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = PatchResourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (
    parsed.data.displayName === undefined &&
    parsed.data.key === undefined &&
    parsed.data.activeVersion === undefined
  ) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  if (parsed.data.activeVersion !== undefined) {
    const exists = await prisma.resourceVersion.findUnique({
      where: {
        resourceId_version: { resourceId, version: parsed.data.activeVersion },
      },
      select: { id: true },
    });

    if (!exists) {
      return NextResponse.json(
        { error: `Version ${parsed.data.activeVersion} does not exist for this resource` },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
        ...(parsed.data.key !== undefined ? { key: parsed.data.key } : {}),
        ...(parsed.data.activeVersion !== undefined ? { activeVersion: parsed.data.activeVersion } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    // Unique constraint on key
    if (error && typeof error === 'object' && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Resource key already exists' },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { thumbnailFileAssetId: true },
    });

    // Collect candidate file assets (may be shared across resources/versions).
    const candidates = await prisma.fileAsset.findMany({
      where: {
        bindings: {
          some: {
            resourceVersion: {
              resourceId,
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
      where: { id: resourceId },
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
