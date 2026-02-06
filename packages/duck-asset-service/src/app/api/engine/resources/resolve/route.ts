/**
 * @swagger
 * /api/engine/resources/resolve:
 *   get:
 *     tags: [Engine]
 *     summary: Resolve a resource for engine runtime
 *     description: Resolve by `key` and optional `version` selector (active | latest | integer). `default` is accepted as an alias for `active`.
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: version
 *         required: false
 *         schema:
 *           type: string
 *         description: active | latest | integer
 *     responses:
 *       200:
 *         description: Resolved resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResolvedResource'
 *       400:
 *         description: Missing key / invalid query
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
import type { ResolvedResource } from '@/lib/types';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  const versionParam = request.nextUrl.searchParams.get('version');

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const resource = await prisma.resource.findFirst({
    where: { key },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const selectedVersion = await (async () => {
    const selector = versionParam ?? 'active';

    if (selector === 'active' || selector === 'default') {
      const active = await prisma.resourceVersion.findUnique({
        where: {
          resourceId_version: {
            resourceId: resource.id,
            version: resource.activeVersion,
          },
        },
        include: { bindings: { include: { fileAsset: true } } },
      });
      if (active) return active;

      // Fallback if DB is out-of-sync.
      return await prisma.resourceVersion.findFirst({
        where: { resourceId: resource.id },
        orderBy: { version: 'desc' },
        include: { bindings: { include: { fileAsset: true } } },
      });
    }

    if (selector === 'latest') {
      return await prisma.resourceVersion.findFirst({
        where: { resourceId: resource.id },
        orderBy: { version: 'desc' },
        include: { bindings: { include: { fileAsset: true } } },
      });
    }

    const parsed = Number(selector);
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

  const files: ResolvedResource['files'] = {};

  for (const binding of selectedVersion.bindings) {
    files[binding.slot] = {
      id: binding.fileAsset.id,
      fileName: binding.fileAsset.fileName,
      contentType: binding.fileAsset.contentType,
      size: binding.fileAsset.size,
      sha256: binding.fileAsset.sha256,
      url: `${baseUrl}/api/files/${binding.fileAsset.id}`,
    };
  }

  const response: ResolvedResource = {
    key: resource.key,
    resourceId: resource.id,
    version: selectedVersion.version,
    componentType: selectedVersion.componentType as any,
    componentData: componentData as any,
    files,
  };

  return NextResponse.json(response);
}
