/**
 * @swagger
 * /api/admin/resources/{resourceId}/versions/{version}/active:
 *   put:
 *     tags: [Admin]
 *     summary: Set active version for a resource
 *     description: Sets the given version number as the active version for the resource.
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
 *         description: Updated resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Invalid version
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource or version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string; version: string }> }
) {
  const { resourceId, version } = await context.params;
  const versionNumber = Number(version);
  if (!Number.isFinite(versionNumber) || versionNumber <= 0 || !Number.isInteger(versionNumber)) {
    return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const existing = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: versionNumber } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: { activeVersion: versionNumber },
  });

  // Best-effort thumbnail regeneration.
  try {
    await updateResourceThumbnailFromVersion(prisma, resource.id, versionNumber);
  } catch {
    // ignore
  }

  const refreshed = await prisma.resource.findUnique({ where: { id: resource.id } });

  return NextResponse.json(refreshed ?? updated);
}
