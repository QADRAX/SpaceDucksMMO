/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     tags: [Files]
 *     summary: Download a FileAsset by id
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Binary file stream
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found / blob missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { StorageService } from '@/lib/storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const fileId = params.fileId;

  const fileAsset = await prisma.fileAsset.findUnique({
    where: { id: fileId },
  });

  if (!fileAsset) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const exists = await StorageService.fileExists(fileAsset.storagePath);
  if (!exists) {
    return NextResponse.json({ error: 'File blob missing' }, { status: 404 });
  }

  const stream = StorageService.createReadStream(fileAsset.storagePath);

  return new NextResponse(stream as any, {
    status: 200,
    headers: {
      'content-type': fileAsset.contentType,
      'cache-control': 'public, max-age=31536000, immutable',
      etag: `\"${fileAsset.sha256}\"`,
    },
  });
}
