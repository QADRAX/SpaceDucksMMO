import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Legacy tags API removed' },
    { status: 410 }
  );
}


/**
 * GET /api/admin/tags?query=...
 * Get all distinct tags with optional prefix filter
 */
