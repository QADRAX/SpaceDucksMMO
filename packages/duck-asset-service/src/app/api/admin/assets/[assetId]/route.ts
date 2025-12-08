import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UpdateAssetSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import type { AssetWithVersions, ParsedAssetWithVersions } from '@/lib/types';
import { parseAsset } from '@/lib/types';
import type { AssetVersion } from '@prisma/client';

interface RouteContext {
  params: {
    assetId: string;
  };
}

/**
 * GET /api/admin/assets/[assetId]
 * Get asset details with all versions
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    const asset: AssetWithVersions | null = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        versions: {
          include: {
            _count: {
              select: { files: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const response: ParsedAssetWithVersions = {
      ...parseAsset(asset),
      versions: asset.versions.map((v): AssetVersion & { fileCount: number } => ({
        ...v,
        fileCount: v._count.files,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get asset', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/assets/[assetId]
 * Update asset metadata
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;
    const body = await request.json();
    
    const validation = UpdateAssetSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates: any = { ...validation.data };
    
    // Convert tags array to JSON string if provided
    if (updates.tags) {
      updates.tags = JSON.stringify(updates.tags);
    }

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: updates,
    });

    logger.info('Asset updated', { assetId: asset.id });

    return NextResponse.json({
      ...asset,
      tags: JSON.parse(asset.tags),
    });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    logger.error('Failed to update asset', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assets/[assetId]
 * Archive an asset (logical delete)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: { isArchived: true },
    });

    logger.info('Asset archived', { assetId: asset.id });

    return NextResponse.json({ message: 'Asset archived successfully' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    logger.error('Failed to archive asset', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
