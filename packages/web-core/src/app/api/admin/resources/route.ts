/**
 * @swagger
 * /api/admin/resources:
 *   get:
 *     tags: [Admin]
 *     summary: List resources
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Admin]
 *     summary: Create a resource
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

import { prisma } from '@/lib/db';
import { createResourceFromZip } from '@/lib/resourceUpload/resourceZip';
import { updateResourceThumbnailFromVersion } from '@/lib/resourceThumbnail';
import { EcsTreeSnapshotSchema, createEmptyEcsTreeSnapshot } from '@/lib/ecsSnapshot';
import {
  CreateResourceSchema,
  CustomMeshComponentDataSchema,
  MaterialComponentSchema,
  MaterialComponentTypeSchema,
  ResourceKindSchema,
} from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { assertCustomMeshGlbProfile } from '@/lib/glb/validateCustomMeshGlb';

function coerceComponentData(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

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

      // ZIP-based create (preferred when available)
      if (zip instanceof File && zip.size > 0) {
        const created = await createResourceFromZip(prisma, zip);

        // Best-effort thumbnail generation.
        try {
          await updateResourceThumbnailFromVersion(prisma, created.resource.id, created.version.version);
        } catch {
          // ignore
        }

        return NextResponse.json(created, { status: 201 });
      }

      // Non-zip multipart create: key/displayName/kind + componentData + slot files.
      const key = formData.get('key');
      const displayName = formData.get('displayName');
      const kindRaw = formData.get('kind');
      const componentDataRaw = formData.get('componentData');

      const parsedCreate = CreateResourceSchema.safeParse({
        key,
        displayName,
        kind: kindRaw,
      });

      if (!parsedCreate.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsedCreate.error.flatten() },
          { status: 400 }
        );
      }

      const componentDataObj = (() => {
        if (typeof componentDataRaw !== 'string' || !componentDataRaw.trim()) return {};
        try {
          return JSON.parse(componentDataRaw);
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

      const kind = parsedCreate.data.kind;
      const hasComponentData = typeof componentDataRaw === 'string' && componentDataRaw.trim().length > 0;

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

      const created = await prisma.$transaction(async (tx) => {
        const resource = await tx.resource.create({
          data: {
            key: parsedCreate.data.key,
            displayName: parsedCreate.data.displayName,
            kind: parsedCreate.data.kind,
            activeVersion: 1,
          },
        });

        const componentDataToStore: Record<string, unknown> = {
          ...((componentPayloadParsed as any).data?.componentData ?? {}),
        };

        const version = await tx.resourceVersion.create({
          data: {
            resourceId: resource.id,
            version: 1,
            componentType: resource.kind,
            componentData: JSON.stringify(componentDataToStore),
          },
        });

        // Bind any file fields except known metadata.
        const reserved = new Set(['zip', 'key', 'displayName', 'kind', 'componentData', 'componentType']);
        const seenSlots = new Set<string>();

        for (const [slot, value] of formData.entries()) {
          if (reserved.has(slot)) continue;
          if (!(value instanceof File) || value.size === 0) continue;

          if (seenSlots.has(slot)) {
            throw new Error(`Duplicate file field for slot: ${slot}`);
          }
          seenSlots.add(slot);

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
              slot,
              fileAssetId: fileAsset.id,
            },
          });

          // Material convenience: map texture bindings into componentData fields.
          if (MaterialComponentTypeSchema.safeParse(kind).success) {
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

            if (supportedTextureFields.has(slot)) {
              const url = `/api/files/${fileId}`;
              if (slot === 'baseColor' || slot === 'albedo') {
                componentDataToStore.texture = url;
              } else {
                componentDataToStore[slot] = url;
              }
            }
          }

          // Custom mesh: store mesh URL convenience.
          if (kind === 'customMesh' && slot.toLowerCase() === 'mesh') {
            componentDataToStore.mesh = `/api/files/${fileId}`;
          }
        }

        // Enforce custom mesh profile (single mesh GLB file).
        if (kind === 'customMesh') {
          const meshUrl = componentDataToStore.mesh;
          if (typeof meshUrl !== 'string' || !meshUrl.length) {
            throw new Error("customMesh requires a 'mesh' file field");
          }

          const meshFile = Array.from(formData.entries()).find(
            ([slot, value]) => slot.toLowerCase() === 'mesh' && value instanceof File
          )?.[1] as File | undefined;

          if (!meshFile || !meshFile.name.toLowerCase().endsWith('.glb')) {
            throw new Error("customMesh 'mesh' file must be a .glb");
          }

          // Only allow the single binding for now.
          if (seenSlots.size !== 1 || !seenSlots.has('mesh')) {
            throw new Error("customMesh only supports a single file binding ('mesh')");
          }
        }

        await tx.resourceVersion.update({
          where: { id: version.id },
          data: { componentData: JSON.stringify(componentDataToStore) },
        });

        return { resource, version };
      });

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
      const initialComponentData =
        parsed.data.kind === 'prefab' || parsed.data.kind === 'scene'
          ? JSON.stringify(createEmptyEcsTreeSnapshot())
          : '{}';

      await tx.resourceVersion.create({
        data: {
          resourceId: resource.id,
          version: 1,
          componentType: resource.kind,
          componentData: initialComponentData,
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
