/**
 * @swagger
 * /api/admin/users/{userId}:
 *   patch:
 *     tags: [Admin, Users]
 *     summary: Update a user
 *     description: Requires SUPER_ADMIN. Cannot change your own role or disable yourself.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchUserRequest'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getSessionUserFromRequest, roleAtLeast } from '@/lib/session';
import { z } from 'zod';

const PatchUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.enum(['ADMIN', 'USER']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const actor = await getSessionUserFromRequest(request);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!roleAtLeast(actor.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (userId === actor.id) {
    if (typeof parsed.data.isActive === 'boolean' && parsed.data.isActive === false) {
      return NextResponse.json({ error: 'Cannot disable yourself' }, { status: 400 });
    }
    if (typeof parsed.data.role === 'string') {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }
  }

  // Prevent lockout: there must always be at least one SUPER_ADMIN.
  if (parsed.data.role === 'ADMIN' || parsed.data.role === 'USER' || parsed.data.isActive === false) {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (target.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', isActive: true },
      });

      const wouldDeactivate = parsed.data.isActive === false;
      const wouldDemote = typeof parsed.data.role === 'string';

      if ((wouldDeactivate || wouldDemote) && superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last super admin' },
          { status: 400 }
        );
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(typeof parsed.data.name === 'string' ? { name: parsed.data.name } : {}),
      ...(typeof parsed.data.role === 'string' ? { role: parsed.data.role } : {}),
      ...(typeof parsed.data.isActive === 'boolean' ? { isActive: parsed.data.isActive } : {}),
      ...(typeof parsed.data.isActive === 'boolean' && parsed.data.isActive === false
        ? { sessionVersion: { increment: 1 } }
        : {}),
    },
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

  return NextResponse.json(updated);
}
