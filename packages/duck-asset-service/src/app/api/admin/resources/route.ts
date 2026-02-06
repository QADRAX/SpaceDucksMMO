/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     tags: [Admin]
 *     summary: List resources
 *     parameters:
 *       - in: query
 *         name: kind
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional resource kind filter (e.g. standardMaterial)
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, count]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceSummary'
 *                 count:
 *                   type: integer
 *   post:
 *     tags: [Admin]
 *     summary: Create a resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceRequest'
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [zip]
 *             properties:
 *               zip:
 *                 type: string
 *                 format: binary
 *                 description: ZIP containing resource.json and slot files (<slot>.<ext>)
 *     responses:
 *       201:
 *         description: Created resource
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Resource'
 *                 - $ref: '#/components/schemas/CreateResourceFromZipResponse'
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { createResourceFromZip } from '@/lib/resourceUpload/resourceZip';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';
import { CreateResourceSchema, ResourceKindSchema } from '@/lib/types';

export async function GET(request: NextRequest) {
  const kindParam = request.nextUrl.searchParams.get('kind');
  const kind = kindParam ? ResourceKindSchema.safeParse(kindParam) : null;

  const data = await prisma.resource.findMany({
    where: {
      ...(kind?.success ? { kind: kind.data } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const zip = formData.get('zip');

      if (!(zip instanceof File) || zip.size === 0) {
        return NextResponse.json({ error: 'zip file is required' }, { status: 400 });
      }

      const created = await createResourceFromZip(prisma, zip);

      // Best-effort thumbnail generation.
      try {
        await updateResourceThumbnailFromVersion(prisma, created.resource.id, created.version.version);
      } catch {
        // ignore
      }

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateResourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const resource = await tx.resource.create({
        data: {
          key: parsed.data.key,
          displayName: parsed.data.displayName,
          kind: parsed.data.kind,
          activeVersion: 1,
        },
      });

      // On first creation, always create version 1 and mark it active.
      await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          version: 1,
          componentType: resource.kind,
          componentData: '{}',
        },
      });

      return resource;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
