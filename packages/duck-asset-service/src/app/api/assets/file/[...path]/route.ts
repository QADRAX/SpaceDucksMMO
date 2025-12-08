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
 * @swagger
 * /api/assets/file/{assetKey}/{version}/{fileName}:
 *   get:
 *     tags: [Files]
 *     summary: Download asset file
 *     description: Download a specific file from an asset version. Use 'latest' as version to get the default/most recent published version.
 *     parameters:
 *       - in: path
 *         name: assetKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset key (may contain slashes)
 *         example: metal-grid-01
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Version number or 'latest'
 *         example: 1.0.0
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: File name
 *         example: albedo.png
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type of the file
 *           Content-Length:
 *             schema:
 *               type: integer
 *             description: File size in bytes
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: Cache directives
 *           ETag:
 *             schema:
 *               type: string
 *             description: Entity tag for cache validation
 *       400:
 *         description: Invalid path format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Asset, version, or file not found
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
