import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the OpenAPI specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI specification
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}
