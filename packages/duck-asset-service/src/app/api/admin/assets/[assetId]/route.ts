import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'Legacy assets API removed',
      message:
        'This Web Core instance was migrated to a resource-first model. Use /api/admin/materials and /api/engine/materials instead.',
    },
    { status: 410 }
  );
}

export async function PATCH() {
  return GET();
}

export async function DELETE() {
  return GET();
}
