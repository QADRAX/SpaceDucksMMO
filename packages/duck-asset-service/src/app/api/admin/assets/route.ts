import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CreateAssetSchema, AssetQuerySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import type { AssetWithVersionCount, AssetListResponse, ParsedAssetWithVersionCount } from '@/lib/types';
import { parseAsset } from '@/lib/types';

/**
 * @swagger
 * /api/admin/assets:
 *   get:
 *     tags: [Admin]
 *     summary: List all assets
 *     description: Get a paginated list of assets with optional filtering
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
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search in key and displayName
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
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
    
    const validation = AssetQuerySchema.safeParse(queryParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { type, category, tag, query, page, limit } = validation.data;

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

    if (query) {
      where.OR = [
        { key: { contains: query } },
        { displayName: { contains: query } },
      ];
    }

    // Filter by tag (tags are stored as JSON string)
    let assets: AssetWithVersionCount[] = await prisma.asset.findMany({
      where,
      include: {
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Filter by tag in memory (since SQLite doesn't have JSON array search)
    if (tag) {
      assets = assets.filter((asset) => {
        try {
          const tags = JSON.parse(asset.tags);
          return Array.isArray(tags) && tags.includes(tag);
        } catch {
          return false;
        }
      });
    }

    const total = await prisma.asset.count({ where });

    const response: AssetListResponse = {
      data: assets.map((asset): ParsedAssetWithVersionCount => ({
        ...parseAsset(asset),
        versionCount: asset._count.versions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to list assets', {
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
 * /api/admin/assets:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new asset
 *     description: Creates a new asset with the provided metadata
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssetRequest'
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Asset with this key already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CreateAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { key, displayName, type, category, tags } = validation.data;

    // Check if active asset with this key already exists (ignore archived)
    const existing = await prisma.asset.findUnique({ where: { key } });
    if (existing && !existing.isArchived) {
      return NextResponse.json(
        { error: 'Asset with this key already exists' },
        { status: 409 }
      );
    }
    
    // If archived asset exists with same key, update it instead of creating new
    if (existing && existing.isArchived) {
      const asset = await prisma.asset.update({
        where: { id: existing.id },
        data: {
          displayName,
          type,
          category,
          tags: JSON.stringify(tags),
          isArchived: false,
          updatedAt: new Date(),
        },
      });

      logger.info('Archived asset restored', { assetId: asset.id, key: asset.key });

      return NextResponse.json(
        {
          ...asset,
          tags: JSON.parse(asset.tags),
        },
        { status: 201 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        key,
        displayName,
        type,
        category,
        tags: JSON.stringify(tags),
      },
    });

    logger.info('Asset created', { assetId: asset.id, key: asset.key });

    return NextResponse.json(
      {
        ...asset,
        tags: JSON.parse(asset.tags),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create asset', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
