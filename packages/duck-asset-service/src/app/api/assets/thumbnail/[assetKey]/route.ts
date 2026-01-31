import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: {
    assetKey: string;
  };
}

/**
 * GET /api/assets/thumbnail/[assetKey]
 * Serve thumbnail image for an asset
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetKey } = context.params;
    const uploadsDir = process.env.ASSET_STORAGE_PATH || '/data/assets';
    const thumbnailPath = path.join(uploadsDir, assetKey, 'thumbnails', 'thumbnail.jpg');

    // Check if thumbnail exists
    try {
      await fs.access(thumbnailPath);
    } catch {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    // Read thumbnail file
    const fileBuffer = await fs.readFile(thumbnailPath);

    // Return image with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    logger.error('Failed to serve thumbnail', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
