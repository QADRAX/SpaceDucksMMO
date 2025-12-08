import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UpdateVersionSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import type { VersionWithFilesAndAsset } from '@/lib/types';

interface RouteContext {
  params: {
    assetId: string;
    versionId: string;
  };
}

/**
 * GET /api/admin/assets/[assetId]/versions/[versionId]
 * Get version details with files
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { versionId } = context.params;

    const version: VersionWithFilesAndAsset | null = await prisma.assetVersion.findUnique({
      where: { id: versionId },
      include: {
        files: true,
        asset: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    logger.error('Failed to get version', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/assets/[assetId]/versions/[versionId]
 * Update version metadata
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId, versionId } = context.params;
    const body = await request.json();

    const validation = UpdateVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If setting isDefault to true, unset other defaults for this asset
    if (updates.isDefault === true) {
      await prisma.assetVersion.updateMany({
        where: {
          assetId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const version = await prisma.assetVersion.update({
      where: { id: versionId },
      data: updates,
    });

    logger.info('Version updated', { versionId, updates });

    return NextResponse.json(version);
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    logger.error('Failed to update version', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/assets/[assetId]/versions/[versionId]
 * Mark version as deprecated
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { versionId } = context.params;

    // For now, just mark as deprecated rather than physical delete
    const version = await prisma.assetVersion.update({
      where: { id: versionId },
      data: {
        status: 'deprecated',
        isDefault: false,
      },
    });

    logger.info('Version marked as deprecated', { versionId });

    return NextResponse.json({ message: 'Version marked as deprecated' });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    logger.error('Failed to delete version', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
