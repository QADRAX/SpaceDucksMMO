import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ManifestQuerySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import type { AssetWithPublishedVersions, ManifestResponse, ManifestEntry, AssetType } from '@/lib/types';
import { parseTags } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/assets/manifest/by-query:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset manifest
 *     description: Get a manifest of published assets with file URLs for game clients
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [material, texture]
 *         description: Filter by asset type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: Asset manifest with file URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       type:
 *                         type: string
 *                       category:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       version:
 *                         type: string
 *                       files:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             fileName:
 *                               type: string
 *                             url:
 *                               type: string
 *                             size:
 *                               type: integer
 *                             hash:
 *                               type: string
 *                             contentType:
 *                               type: string
 *                             mapType:
 *                               type: string
 *                               nullable: true
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = ManifestQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { type, category, tag } = validation.data;

    // Build where clause
    const where: any = {
      isArchived: false,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = {
        startsWith: category,
      };
    }

    // Get all matching assets
    let assets: AssetWithPublishedVersions[] = await prisma.asset.findMany({
      where,
      include: {
        versions: {
          where: {
            status: 'published',
          },
          include: {
            files: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Filter by tag if provided
    if (tag) {
      assets = assets.filter((asset) => {
        const tags = parseTags(asset.tags);
        return tags.includes(tag);
      });
    }

    // Filter assets that have at least one published version
    assets = assets.filter((asset) => asset.versions.length > 0);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Build manifest entries
    const manifest: ManifestEntry[] = assets.map((asset): ManifestEntry => {
      // Find the default version or the most recent published one
      const defaultVersion = asset.versions.find((v) => v.isDefault);
      const effectiveVersion = defaultVersion || asset.versions[0];

      return {
        assetKey: asset.key,
        displayName: asset.displayName,
        type: asset.type as AssetType,
        category: asset.category,
        tags: parseTags(asset.tags),
        version: effectiveVersion.version,
        files: effectiveVersion.files.map((file) => ({
          fileName: file.fileName,
          url: `${baseUrl}/api/assets/file/${asset.key}/${effectiveVersion.version}/${file.fileName}`,
          size: file.size,
          hash: file.hash,
          contentType: file.contentType,
          mapType: file.mapType,
        })),
      };
    });

    const response: ManifestResponse = {
      data: manifest,
      count: manifest.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to generate manifest', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
