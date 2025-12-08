import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CreateVersionSchema } from '@/lib/validation';
import { StorageService } from '@/lib/storage';
import { logger } from '@/lib/logger';
import type { VersionWithFiles, VersionListResponse } from '@/lib/types';
import type { AssetVersion } from '@prisma/client';

interface RouteContext {
  params: {
    assetId: string;
  };
}

/**
 * GET /api/admin/assets/[assetId]/versions
 * List all versions for an asset
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    const versions: VersionWithFiles[] = await prisma.assetVersion.findMany({
      where: { assetId },
      include: {
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: VersionListResponse = { data: versions };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to list versions', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/assets/[assetId]/versions
 * Create a new version with file uploads
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { assetId } = context.params;

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    
    const versionString = formData.get('version') as string | null;
    const status = (formData.get('status') as string) || 'draft';
    const notes = formData.get('notes') as string | null;
    
    // Get all file entries
    const fileEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith('files'))
      .map(([, value]) => value as File);

    if (fileEntries.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Auto-generate version if not provided
    const version = versionString || generateNextVersion(asset.versions);

    // Validate version data
    const validation = CreateVersionSchema.safeParse({
      version,
      status,
      notes,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid version data', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if version already exists
    const existingVersion = await prisma.assetVersion.findUnique({
      where: {
        assetId_version: {
          assetId,
          version,
        },
      },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: 'Version already exists' },
        { status: 409 }
      );
    }

    // Create version record
    const assetVersion = await prisma.assetVersion.create({
      data: {
        assetId,
        version,
        status: validation.data.status || 'draft',
        notes: validation.data.notes,
        isDefault: false, // Will be set explicitly via PATCH
      },
    });

    // Save files and create file records
    const fileRecords = [];
    for (const file of fileEntries) {
      const metadata = await StorageService.saveFile(
        asset.key,
        version,
        file,
        file.name
      );

      const fileRecord = await prisma.assetFile.create({
        data: {
          assetVersionId: assetVersion.id,
          fileName: metadata.fileName,
          relativePath: null,
          contentType: metadata.contentType,
          size: metadata.size,
          hash: metadata.hash,
        },
      });

      fileRecords.push(fileRecord);
    }

    logger.info('Version created with files', {
      assetId,
      versionId: assetVersion.id,
      version,
      fileCount: fileRecords.length,
    });

    return NextResponse.json(
      {
        ...assetVersion,
        files: fileRecords,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create version', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateNextVersion(existingVersions: any[]): string {
  if (existingVersions.length === 0) {
    return '1';
  }

  // Try to parse as integers and increment
  const numericVersions = existingVersions
    .map((v) => parseInt(v.version, 10))
    .filter((n) => !isNaN(n));

  if (numericVersions.length > 0) {
    const maxVersion = Math.max(...numericVersions);
    return String(maxVersion + 1);
  }

  // Fallback: use timestamp
  return Date.now().toString();
}
