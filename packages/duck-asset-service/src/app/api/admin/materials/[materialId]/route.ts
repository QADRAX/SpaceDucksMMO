import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { RESOURCE_KIND_MATERIAL } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const resource = await prisma.resource.findFirst({
    where: { id: params.materialId, kind: RESOURCE_KIND_MATERIAL },
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
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const body = await request.json().catch(() => null);
  const displayName = typeof body?.displayName === 'string' ? body.displayName : undefined;
  const isArchived = typeof body?.isArchived === 'boolean' ? body.isArchived : undefined;

  if (displayName === undefined && isArchived === undefined) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  const updated = await prisma.resource.update({
    where: { id: params.materialId },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(isArchived !== undefined ? { isArchived } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  const updated = await prisma.resource.update({
    where: { id: params.materialId },
    data: { isArchived: true },
  });

  return NextResponse.json(updated);
}
