/**
 * @swagger
 * /api/resources/kinds:
 *   get:
 *     tags: [Resources]
 *     summary: List supported resource kinds
 *     description: Returns the list of resource kinds currently supported by this API.
 *     responses:
 *       200:
 *         description: Supported resource kinds
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceKindsResponse'
 */

import { NextResponse } from 'next/server';

import { MATERIAL_RESOURCE_KINDS } from '@/lib/types';

export async function GET() {
  return NextResponse.json({ data: [...MATERIAL_RESOURCE_KINDS] });
}
