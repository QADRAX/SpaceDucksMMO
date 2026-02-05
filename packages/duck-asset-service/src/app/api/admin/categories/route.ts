import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Legacy categories API removed' },
    { status: 410 }
  );
}
