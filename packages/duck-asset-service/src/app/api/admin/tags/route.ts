import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { TagListResponse } from '@/lib/types';
import { parseTags } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tags?query=...
 * Get all distinct tags with optional prefix filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const assets = await prisma.asset.findMany({
      where: {
        isArchived: false,
      },
      select: {
        tags: true,
      },
    });

    // Extract all unique tags
    const tagSet = new Set<string>();
    
    for (const asset of assets) {
      const tags = parseTags(asset.tags);
      tags.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagSet.add(tag);
        }
      });
    }

    const tags = Array.from(tagSet).sort();

    const response: TagListResponse = { data: tags };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get tags', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
