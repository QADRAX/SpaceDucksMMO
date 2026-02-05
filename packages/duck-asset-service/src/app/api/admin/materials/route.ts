import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import {
  CreateMaterialResourceSchema,
  RESOURCE_KIND_MATERIAL,
} from '@/lib/types';

export async function GET(_request: NextRequest) {
  const data = await prisma.resource.findMany({
    where: { kind: RESOURCE_KIND_MATERIAL },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateMaterialResourceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.resource.create({
      data: {
        key: parsed.data.key,
        displayName: parsed.data.displayName,
        kind: RESOURCE_KIND_MATERIAL,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
