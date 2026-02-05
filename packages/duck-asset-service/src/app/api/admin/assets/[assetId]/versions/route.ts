import { NextResponse } from 'next/server';

/**
 * GET /api/admin/assets/[assetId]/versions
 * List all versions for an asset
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Legacy assets API removed' },
    { status: 410 }
  );
}

export async function POST() {
  return GET();
}
