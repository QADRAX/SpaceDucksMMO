import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Legacy thumbnails API removed' },
    { status: 410 }
  );
}
