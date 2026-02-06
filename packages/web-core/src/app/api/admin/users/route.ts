/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin, Users]
 *     summary: List users
 *     description: Requires SUPER_ADMIN.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, count]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getSessionUserFromRequest, roleAtLeast } from '@/lib/session';

export async function GET(request: NextRequest) {
  const actor = await getSessionUserFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!roleAtLeast(actor.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data, count: data.length });
}
