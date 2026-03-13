/**
 * @swagger
 * /api/admin/users/invites:
 *   get:
 *     tags: [Admin, Users]
 *     summary: List user invites
 *     description: Requires SUPER_ADMIN.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of invites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, count]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserInvite'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   post:
 *     tags: [Admin, Users]
 *     summary: Create a user invite
 *     description: |
 *       Requires SUPER_ADMIN. The response includes an invite URL that contains a one-time token.
 *       There is no email integration; the super admin is expected to share this URL manually.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInviteRequest'
 *     responses:
 *       201:
 *         description: Created invite
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserInviteResponse'
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getSessionUserFromRequest, roleAtLeast } from '@/lib/session';
import { generateInviteToken, getAppBaseUrl, sha256Base64Url } from '@/lib/invites';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const CreateInviteSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(255),
    role: z.enum(['ADMIN', 'USER']).default('USER'),
    expiresInHours: z.number().int().min(1).max(24 * 30).optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  const actor = await getSessionUserFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!roleAtLeast(actor.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await prisma.userInvite.findMany({
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      claimedAt: true,
      createdByUserId: true,
      claimedByUserId: true,
    },
  });

  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: NextRequest) {
  const actor = await getSessionUserFromRequest(request);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!roleAtLeast(actor.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const token = generateInviteToken();
  const tokenSha256 = await sha256Base64Url(token);
  const expiresInHours = parsed.data.expiresInHours ?? 24 * 7;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  // Create a disabled user record up-front (Strapi-like invitation). It can't be used to login until claimed.
  const placeholderPassword = generateInviteToken(48);
  const passwordHash = await hashPassword(placeholderPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        isActive: false,
      },
      select: { id: true },
    });

    await tx.userInvite.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        role: parsed.data.role,
        tokenSha256,
        expiresAt,
        createdByUserId: actor.id,
      },
      select: { id: true },
    });
  });

  const inviteUrl = `${getAppBaseUrl().replace(/\/$/, '')}/invite?token=${encodeURIComponent(token)}`;

  return NextResponse.json(
    {
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    },
    { status: 201 }
  );
}
