import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Legacy assets manifest API removed',
      message:
        'Web Core migrated to a resource-first model. Engine-facing resolution endpoints live under /api/engine/*.',
    },
    { status: 410 }
  );
}
