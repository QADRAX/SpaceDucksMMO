import { prisma } from '@/lib/db';

let cached: { checkedAt: number; setupComplete: boolean } | null = null;

export async function isSetupComplete(): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.checkedAt < 2000) {
    return cached.setupComplete;
  }

  const count = await prisma.user.count();
  const setupComplete = count > 0;
  cached = { checkedAt: now, setupComplete };
  return setupComplete;
}
