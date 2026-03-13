import { NextResponse } from 'next/server';

import { isSetupComplete } from '@/lib/setup';

export async function GET() {
  const setupComplete = await isSetupComplete();
  return NextResponse.json({ setupComplete });
}
