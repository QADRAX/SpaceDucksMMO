/**
 * @swagger
 * /api/admin/resources/{resourceId}/versions:
 *   get:
 *     tags: [Admin]
 *     summary: List versions for a resource
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Admin]
 *     summary: Create a new version
 *     description: Supports either a ZIP upload (version.json + slot files) or multipart upload (componentData + any file slot fields). The newly created version becomes the active version.
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

import { prisma } from '@/lib/db';
import { createResourceVersionFromZip } from '@/lib/resourceUpload/resourceZip';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';
import { StorageService } from '@/lib/storage';
import {
  type EcsTreeSnapshot,
  safeParseEcsTreeSnapshot,
  createEmptyEcsTreeSnapshot,
  EcsTreeSnapshotSchema,
} from '@/lib/ecs-snapshot';
import {
  CreateResourceVersionSchema,
  CustomMeshComponentDataSchema,
  MaterialComponentSchema,
  MaterialComponentTypeSchema,
} from '@/lib/types';
import { assertCustomMeshGlbProfile } from '@/lib/glb/validateCustomMeshGlb';

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

  // Validate per-kind.
  const kind = resource.kind;
  const hasComponentData = typeof rawComponentData === 'string' && rawComponentData.trim().length > 0;
  const componentPayloadParsed = (() => {
    const materialKind = MaterialComponentTypeSchema.safeParse(kind);
    if (materialKind.success) {
      const componentDataCoerced = coerceComponentData(componentDataObj);
      return MaterialComponentSchema.safeParse({
        componentType: materialKind.data,
        componentData: componentDataCoerced,
      });
    }
    if (kind === 'customMesh') {
      const componentDataCoerced = coerceComponentData(componentDataObj);
      const parsed = CustomMeshComponentDataSchema.safeParse(componentDataCoerced);
      return parsed.success
        ? ({ success: true, data: { componentData: parsed.data } } as const)
        : parsed;
    }
    if (kind === 'prefab' || kind === 'scene') {
      const input = hasComponentData ? componentDataObj : createEmptyEcsTreeSnapshot();
      const parsed = EcsTreeSnapshotSchema.safeParse(input);
      return parsed.success
        ? ({ success: true, data: { componentData: parsed.data } } as const)
        : parsed;
    }
    return { success: false } as any;
  })();

  if (!componentPayloadParsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid component data',
        details: (componentPayloadParsed as any).error?.flatten?.() ?? undefined,
      },
      { status: 400 }
    );
  }

  // Strict customMesh validation should happen before opening a DB transaction.
  if (kind === 'customMesh') {
    const meshFile = Array.from(formData.entries()).find(
      ([slot, value]) => slot.toLowerCase() === 'mesh' && value instanceof File
    )?.[1] as File | undefined;

    if (!meshFile || meshFile.size === 0) {
      return NextResponse.json({ error: "customMesh requires a 'mesh' file field" }, { status: 400 });
    }
    if (!meshFile.name.toLowerCase().endsWith('.glb')) {
      return NextResponse.json({ error: "customMesh 'mesh' file must be a .glb" }, { status: 400 });
    }

    try {
      const bytes = await meshFile.arrayBuffer();
      assertCustomMeshGlbProfile(bytes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid GLB';
      return NextResponse.json({ error: msg }, { status: 400 });
    }
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
      const componentDataToStore: Record<string, unknown> = {
        ...((componentPayloadParsed as any).data?.componentData ?? {}),
      };

      const version = await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          version: nextVersion,
          componentType: resource.kind,
          componentData: JSON.stringify(componentDataToStore),
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

        // Material convenience: map texture bindings into componentData fields.
        if (MaterialComponentTypeSchema.safeParse(kind).success) {
          // If the uploaded slot name matches a known material texture field,
          // store a direct URL in componentData so renderers can load it.
          // This avoids relying on a texture catalog for admin-authored materials.
          const supportedTextureFields = new Set([
            // componentData fields
            'texture',
            'normalMap',
            'envMap',
            'aoMap',
            'roughnessMap',
            'metalnessMap',
            'specularMap',
            'bumpMap',
            // friendly binding aliases -> componentData.texture
            'baseColor',
            'albedo',
          ]);

          if (supportedTextureFields.has(key)) {
            const url = `/api/files/${fileId}`;
            if (key === 'baseColor' || key === 'albedo') {
              componentDataToStore.texture = url;
            } else {
              componentDataToStore[key] = url;
            }
          }
        }

        // Custom mesh convenience: store mesh URL.
        if (kind === 'customMesh' && key.toLowerCase() === 'mesh') {
          componentDataToStore.mesh = `/api/files/${fileId}`;
        }
      }

      // Enforce custom mesh profile (single mesh GLB file).
      if (kind === 'customMesh') {
        const meshUrl = componentDataToStore.mesh;
        if (typeof meshUrl !== 'string' || !meshUrl.length) {
          throw new Error("customMesh requires a 'mesh' file field");
        }

        const hasMeshSlot = Array.from(seenSlots).some((s) => s.toLowerCase() === 'mesh');
        if (seenSlots.size !== 1 || !hasMeshSlot) {
          throw new Error("customMesh only supports a single file binding ('mesh')");
        }

        const meshFile = Array.from(formData.entries()).find(
          ([slot, value]) => slot.toLowerCase() === 'mesh' && value instanceof File
        )?.[1] as File | undefined;

        if (!meshFile || !meshFile.name.toLowerCase().endsWith('.glb')) {
          throw new Error("customMesh 'mesh' file must be a .glb");
        }
      }

      // Persist any componentData updates produced by uploaded files.
      await tx.resourceVersion.update({
        where: { id: version.id },
        data: { componentData: JSON.stringify(componentDataToStore) },
      });

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
