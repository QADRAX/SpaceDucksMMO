/**
 * @swagger
 * /api/auth/invite/validate:
 *   get:
 *     tags: [Auth]
 *     summary: Validate an invite token
 *     description: Public endpoint used by the invitation acceptance page.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [ok, invite]
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 invite:
 *                   $ref: '#/components/schemas/InvitePublic'
 *       400:
 *         description: Missing token
 *       404:
 *         description: Invalid/expired invite
 *       409:
 *         description: Already claimed / user already active
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { sha256Base64Url } from '@/lib/invites';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const tokenSha256 = await sha256Base64Url(token);
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

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
    select: { id: true, isActive: true },
  });

  if (existingUser?.isActive) {
    return NextResponse.json({ error: 'User already active' }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    invite: {
      email: invite.email,
      name: invite.name,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
    },
  });
}
