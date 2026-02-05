import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import {
  RESOURCE_KIND_MATERIAL,
  type ResolvedMaterialResource,
} from '@/lib/types';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const versionParam = request.nextUrl.searchParams.get('version');

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const resource = await prisma.resource.findFirst({
    where: { key, kind: RESOURCE_KIND_MATERIAL, isArchived: false },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }

  const selectedVersion = await (async () => {
    if (!versionParam || versionParam === 'default') {
      return await prisma.resourceVersion.findFirst({
        where: { resourceId: resource.id },
        orderBy: [{ isDefault: 'desc' }, { version: 'desc' }],
        include: { bindings: { include: { fileAsset: true } } },
      });
    }

    if (versionParam === 'latest') {
      return await prisma.resourceVersion.findFirst({
        where: { resourceId: resource.id },
        orderBy: { version: 'desc' },
        include: { bindings: { include: { fileAsset: true } } },
      });
    }

    const parsed = Number(versionParam);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;

    return await prisma.resourceVersion.findUnique({
      where: { resourceId_version: { resourceId: resource.id, version: parsed } },
      include: { bindings: { include: { fileAsset: true } } },
    });
  })();

  if (!selectedVersion) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const baseUrl = process.env.BASE_URL || request.nextUrl.origin;

  const componentData = (() => {
    const raw = selectedVersion.componentData;
    if (typeof raw !== 'string' || !raw.trim()) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  })();

  const textures: ResolvedMaterialResource['textures'] = {};

  for (const binding of selectedVersion.bindings) {
    textures[binding.slot] = {
      id: binding.fileAsset.id,
      fileName: binding.fileAsset.fileName,
      contentType: binding.fileAsset.contentType,
      size: binding.fileAsset.size,
      sha256: binding.fileAsset.sha256,
      url: `${baseUrl}/api/files/${binding.fileAsset.id}`,
    };
  }

  const response: ResolvedMaterialResource = {
    key: resource.key,
    resourceId: resource.id,
    version: selectedVersion.version,
    status: selectedVersion.status as any,
    componentType: selectedVersion.componentType as any,
    componentData: componentData as any,
    textures,
  };

  return NextResponse.json(response);
}
