import { NextResponse } from 'next/server';

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
export async function GET() {
  return NextResponse.json(
    {
      error: 'Legacy assets file API removed',
      message: 'Use /api/files/{fileId} (FileAsset) instead.',
    },
    { status: 410 }
  );
}
