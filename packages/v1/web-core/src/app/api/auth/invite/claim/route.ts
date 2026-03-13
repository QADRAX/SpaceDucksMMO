/**
 * @swagger
 * /api/auth/invite/claim:
 *   post:
 *     tags: [Auth]
 *     summary: Claim an invite
 *     description: Public endpoint used by the invitation acceptance page. Sets the password and activates the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimInviteRequest'
 *     responses:
 *       200:
 *         description: Invite claimed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [ok]
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Invalid/expired invite
 *       409:
 *         description: Already claimed / user already active
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import {
  createAuthJwt,
  getAuthCookieName,
  getDefaultAuthMaxAgeSeconds,
  getJwtSecret,
  hashPassword,
} from '@/lib/auth';
import { sha256Base64Url } from '@/lib/invites';
import { z } from 'zod';

const ClaimInviteSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(10).max(200),
    name: z.string().trim().min(2).max(80).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = ClaimInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const tokenSha256 = await sha256Base64Url(parsed.data.token);
  const invite = await prisma.userInvite.findUnique({
    where: { tokenSha256 },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      claimedAt: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 404 });
  }

  if (invite.claimedAt) {
    return NextResponse.json({ error: 'Invite already claimed' }, { status: 409 });
  }

  if (Date.now() > invite.expiresAt.getTime()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: invite.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found for invite' }, { status: 404 });
  }

  if (user.isActive) {
    return NextResponse.json({ error: 'User already active' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        ...(typeof parsed.data.name === 'string' ? { name: parsed.data.name } : { name: invite.name }),
      },
      select: { id: true, email: true, name: true, role: true, sessionVersion: true },
    });

    await tx.userInvite.update({
      where: { id: invite.id },
      data: {
        claimedAt: new Date(),
        claimedByUserId: updatedUser.id,
      },
      select: { id: true },
    });

    return updatedUser;
  });

  const maxAgeSeconds = getDefaultAuthMaxAgeSeconds();
  const iat = Math.floor(Date.now() / 1000);

  const token = await createAuthJwt(
    {
      sub: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      sv: updated.sessionVersion,
      iat,
      exp: iat + maxAgeSeconds,
    },
    getJwtSecret()
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAuthCookieName(),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  });

  return res;
}
