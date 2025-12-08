import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CreateAssetSchema, AssetQuerySchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import type { AssetWithVersionCount, AssetListResponse, ParsedAssetWithVersionCount } from '@/lib/types';
import { parseAsset } from '@/lib/types';

/**
 * GET /api/admin/assets
 * List assets with optional filtering and pagination
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
 * POST /api/admin/assets
 * Create a new asset
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

    // Check if asset with this key already exists
    const existing = await prisma.asset.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json(
        { error: 'Asset with this key already exists' },
        { status: 409 }
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
