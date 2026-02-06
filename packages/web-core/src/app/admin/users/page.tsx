import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/organisms/PageHeader';
import { Card } from '@/components/molecules/Card';
import { UsersClient } from './users-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UsersPage() {
  const [users, invites] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.userInvite.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
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
    }),
  ]);

  const usersForClient = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  const invitesForClient = invites.map((inv) => ({
    ...inv,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    claimedAt: inv.claimedAt ? inv.claimedAt.toISOString() : null,
  }));

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage users and invitations (SUPER_ADMIN only)"
      />

      <Card className="p-6">
        <UsersClient initialUsers={usersForClient} initialInvites={invitesForClient} />
      </Card>
    </div>
  );
}
