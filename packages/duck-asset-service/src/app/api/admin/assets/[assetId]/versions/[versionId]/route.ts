import { NextResponse } from 'next/server';

/**
 * GET /api/admin/assets/[assetId]/versions/[versionId]
 * Get version details with files
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Legacy assets API removed' },
    { status: 410 }
  );
}

export async function PATCH() {
  return GET();
}

export async function DELETE() {
  return GET();
}
