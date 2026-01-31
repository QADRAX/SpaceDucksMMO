import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;

    const settings = await prisma.assetSettings.findUnique({
      where: { assetId },
    });

    if (!settings) {
      return NextResponse.json(null);
    }

    return NextResponse.json(settings.settings);
  } catch (error) {
    console.error('Error loading asset settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const { assetId } = params;
    const body = await request.json();
    
    // Extract the settings string from the body
    const settingsString = body.settings;

    const saved = await prisma.assetSettings.upsert({
      where: { assetId },
      update: { settings: settingsString },
      create: {
        assetId,
        settings: settingsString,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving asset settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
