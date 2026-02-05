import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/storage';
import {
  CreateMaterialVersionSchema,
  MaterialComponentSchema,
  RESOURCE_KIND_MATERIAL,
  ResourceStatusSchema,
} from '@/lib/types';

const ALL_SLOTS = [
  'texture',
  'normalMap',
  'envMap',
  'aoMap',
  'roughnessMap',
  'metalnessMap',
  'specularMap',
  'bumpMap',
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const versions = await prisma.resourceVersion.findMany({
    where: { resourceId: params.materialId },
    orderBy: { version: 'desc' },
    include: {
      bindings: { include: { fileAsset: true } },
    },
  });

  return NextResponse.json({ data: versions, count: versions.length });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const resource = await prisma.resource.findFirst({
    where: { id: params.materialId, kind: RESOURCE_KIND_MATERIAL },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }

  const formData = await request.formData();

  const rawVersion = formData.get('version');
  const rawStatus = formData.get('status');
  const rawIsDefault = formData.get('isDefault');
  const rawComponentType = formData.get('componentType');
  const rawComponentData = formData.get('componentData');

  const parsed = CreateMaterialVersionSchema.safeParse({
    version:
      typeof rawVersion === 'string' && rawVersion.length
        ? Number(rawVersion)
        : undefined,
    status: typeof rawStatus === 'string' && rawStatus.length ? rawStatus : undefined,
    isDefault:
      typeof rawIsDefault === 'string'
        ? rawIsDefault === 'true'
        : undefined,
    componentType: rawComponentType,
    componentData: rawComponentData,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const status = parsed.data.status
    ? ResourceStatusSchema.parse(parsed.data.status)
    : 'draft';

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

  const componentPayloadParsed = MaterialComponentSchema.safeParse({
    componentType: parsed.data.componentType,
    componentData: componentDataObj,
  });

  if (!componentPayloadParsed.success) {
    return NextResponse.json(
      { error: 'Invalid component data', details: componentPayloadParsed.error.flatten() },
      { status: 400 }
    );
  }

  const nextVersion = await (async () => {
    if (parsed.data.version) return parsed.data.version;
    const last = await prisma.resourceVersion.findFirst({
      where: { resourceId: resource.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (last?.version || 0) + 1;
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

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.resourceVersion.updateMany({
        where: { resourceId: resource.id },
        data: { isDefault: false },
      });
    }

    const version = await tx.resourceVersion.create({
      data: {
        resourceId: resource.id,
        version: nextVersion,
        status,
        isDefault: Boolean(parsed.data.isDefault),
        componentType: componentPayloadParsed.data.componentType,
        componentData: JSON.stringify(componentPayloadParsed.data.componentData ?? {}),
      },
    });

    const bindingsToCreate: Array<{ slot: string; file: File }> = [];

    for (const slot of ALL_SLOTS) {
      const value = formData.get(slot);
      if (value instanceof File && value.size > 0) {
        bindingsToCreate.push({ slot, file: value });
      }
    }

    for (const binding of bindingsToCreate) {
      const fileId = crypto.randomUUID();
      const saved = await StorageService.saveFile(binding.file, binding.file.name, {
        fileId,
        contentType: binding.file.type || undefined,
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
          slot: binding.slot,
          fileAssetId: fileAsset.id,
        },
      });
    }

    return version;
  });

  return NextResponse.json(created, { status: 201 });
}
