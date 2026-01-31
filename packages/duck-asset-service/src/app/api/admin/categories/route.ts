import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { CategoryListResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/categories
 * Get all distinct categories
 */
export async function GET(request: NextRequest) {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        isArchived: false,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categories = assets.map((a) => a.category);

    const response: CategoryListResponse = { data: categories };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
