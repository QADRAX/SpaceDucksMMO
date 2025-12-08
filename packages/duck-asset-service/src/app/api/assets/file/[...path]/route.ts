import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/storage';
import { logger } from '@/lib/logger';
import type { Asset, AssetVersion } from '@prisma/client';

interface RouteContext {
  params: {
    path: string[];
  };
}

/**
 * GET /api/assets/file/[assetKey]/[version]/[fileName]
 * GET /api/assets/file/[assetKey]/latest/[fileName]
 * 
 * Stream asset file
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const pathSegments = context.params.path;

    if (pathSegments.length < 3) {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 }
      );
    }

    // Reconstruct assetKey (may contain slashes)
    const fileName = pathSegments[pathSegments.length - 1];
    const versionOrLatest = pathSegments[pathSegments.length - 2];
    const assetKeyParts = pathSegments.slice(0, pathSegments.length - 2);
    const assetKey = assetKeyParts.join('/');

    // Find the asset
    const asset: (Asset & { versions: AssetVersion[] }) | null = await prisma.asset.findUnique({
      where: { key: assetKey },
      include: {
        versions: {
          where: {
            status: 'published',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!asset || asset.isArchived) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Determine the version
    let version: string;
    
    if (versionOrLatest === 'latest') {
      // Find default or most recent published version
      const defaultVersion = asset.versions.find((v) => v.isDefault);
      const effectiveVersion = defaultVersion || asset.versions[0];
      
      if (!effectiveVersion) {
        return NextResponse.json(
          { error: 'No published version available' },
          { status: 404 }
        );
      }
      
      version = effectiveVersion.version;
    } else {
      version = versionOrLatest;
      
      // Verify version exists and is published
      const versionExists = asset.versions.some((v) => v.version === version);
      
      if (!versionExists) {
        return NextResponse.json(
          { error: 'Version not found or not published' },
          { status: 404 }
        );
      }
    }

    // Check if file exists
    const fileExists = await StorageService.fileExists(assetKey, version, fileName);
    
    if (!fileExists) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file stats for headers
    const stats = await StorageService.getFileStats(assetKey, version, fileName);
    
    // Get content type
    const contentType = StorageService.getContentTypeFromExtension(fileName);

    // Read file as buffer (for small files) or stream (for large files)
    const buffer = await StorageService.readFile(assetKey, version, fileName);

    logger.info('File served', { assetKey, version, fileName, size: stats.size });

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${assetKey}-${version}-${fileName}"`,
      },
    });
  } catch (error) {
    logger.error('Failed to serve file', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
