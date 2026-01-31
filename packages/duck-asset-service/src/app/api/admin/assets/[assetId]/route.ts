import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UpdateAssetSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { StorageService } from '@/lib/storage';
import type { AssetWithVersions, ParsedAssetWithVersions } from '@/lib/types';
import { parseAsset } from '@/lib/types';
import type { AssetVersion } from '@prisma/client';

interface RouteContext {
  params: {
    assetId: string;
  };
}

/**
 * @swagger
 * /api/admin/assets/{assetId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get asset details
 *     description: Get detailed information about a specific asset including all versions
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Asset'
 *                 - type: object
 *                   properties:
 *                     versions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssetVersion'
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        versions: {
          include: {
            files: true,
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
      versions: asset.versions.map((v) => ({
        ...v,
        fileCount: v._count.files,
        files: v.files,
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
 * @swagger
 * /api/admin/assets/{assetId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete an asset
 *     description: Archives an asset (soft delete) and removes all associated files from storage
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    // Get asset info before deleting
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { key: true },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Delete all physical files for this asset
    await StorageService.deleteAsset(asset.key);

    // Delete the asset from database (cascade will delete versions and files)
    await prisma.asset.delete({
      where: { id: assetId },
    });

    logger.info('Asset deleted', { 
      assetId, 
      assetKey: asset.key 
    });

    return NextResponse.json({ message: 'Asset deleted successfully' });
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
