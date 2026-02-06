/**
 * @swagger
 * /api/admin/resources/{resourceId}/versions:
 *   get:
 *     tags: [Admin]
 *     summary: List versions for a resource
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of versions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, count]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceVersionWithBindings'
 *                 count:
 *                   type: integer
 *   post:
 *     tags: [Admin]
 *     summary: Create a new version
 *     description: Supports either a ZIP upload (version.json + slot files) or multipart upload (componentData + any file slot fields). The newly created version becomes the active version.
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             description: If `zip` is provided, it takes precedence over the legacy fields.
 *             properties:
 *               zip:
 *                 type: string
 *                 format: binary
 *                 description: ZIP containing version.json and slot files (<slot>.<ext>)
 *               version:
 *                 type: integer
 *                 description: Optional explicit version; if provided must be the next incremental version
 *               componentData:
 *                 type: string
 *                 description: JSON string (optional)
 *               componentType:
 *                 type: string
 *                 description: Optional legacy; must match the resource kind when provided
 *     responses:
 *       201:
 *         description: Created version
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceVersion'
 *       400:
 *         description: Invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Version already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

import { prisma } from '@/lib/db';
import { createResourceVersionFromZip } from '@/lib/resourceUpload/resourceZip';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';
import { StorageService } from '@/lib/storage';
import { CreateResourceVersionSchema, MaterialComponentSchema } from '@/lib/types';

function coerceComponentData(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;
  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId },
    orderBy: { version: 'desc' },
    include: {
      bindings: { include: { fileAsset: true } },
    },
  });

  return NextResponse.json({ data: versions, count: versions.length });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await context.params;
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Unsupported content-type. Use multipart/form-data.' },
      { status: 415 }
    );
  }

  const formData = await request.formData();
  const zip = formData.get('zip');
  if (zip instanceof File && zip.size > 0) {
    try {
      const created = await createResourceVersionFromZip(
        prisma,
        resource.id,
        resource.kind,
        zip
      );

      // Best-effort thumbnail generation.
      try {
        await updateResourceThumbnailFromVersion(prisma, resource.id, created.version);
      } catch {
        // ignore
      }

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (typeof message === 'string' && message.includes('already exists')) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }
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
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.componentType && parsed.data.componentType !== resource.kind) {
    return NextResponse.json(
      { error: 'componentType must match resource kind' },
      { status: 400 }
    );
  }

  const componentDataObj = (() => {
    if (typeof rawComponentData !== 'string' || !rawComponentData.trim()) return {};
    try {
      return JSON.parse(rawComponentData);
    } catch {
      return null;
    }
  })();

  if (componentDataObj === null) {
    return NextResponse.json(
      { error: 'componentData must be valid JSON (or omitted)' },
      { status: 400 }
    );
  }

  // Validate per-kind. For now, only material kinds are supported.
  const componentPayloadParsed = MaterialComponentSchema.safeParse({
    componentType: resource.kind as any,
    componentData: coerceComponentData(componentDataObj),
  });

  if (!componentPayloadParsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid component data',
        details: componentPayloadParsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const nextVersion = await (async () => {
    const last = await prisma.resourceVersion.findFirst({
      where: { resourceId: resource.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const expected = (last?.version || 0) + 1;

    if (parsed.data.version !== undefined) {
      if (parsed.data.version !== expected) {
        throw new Error(`version must be next incremental value (${expected})`);
      }
      return parsed.data.version;
    }

    return expected;
  })();

  const existing = await prisma.resourceVersion.findUnique({
    where: { resourceId_version: { resourceId: resource.id, version: nextVersion } },
  });

  if (existing) {
    return NextResponse.json(
      { error: `Version ${nextVersion} already exists` },
      { status: 409 }
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const version = await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          version: nextVersion,
          componentType: resource.kind,
          componentData: JSON.stringify(componentPayloadParsed.data.componentData ?? {}),
        },
      });

      // Bind any file fields except known metadata.
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
        const saved = await StorageService.saveFile(value, value.name, {
          fileId,
          contentType: value.type || undefined,
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

        await tx.resourceBinding.create({
          data: {
            resourceVersionId: version.id,
            slot: key,
            fileAssetId: fileAsset.id,
          },
        });
      }

      // Newly created version becomes active.
      await tx.resource.update({
        where: { id: resource.id },
        data: { activeVersion: nextVersion },
      });

      return version;
    });

    // Best-effort thumbnail generation.
    try {
      await updateResourceThumbnailFromVersion(prisma, resource.id, nextVersion);
    } catch {
      // ignore
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
