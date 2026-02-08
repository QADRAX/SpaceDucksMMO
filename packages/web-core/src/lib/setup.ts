import { prisma } from '@/lib/db';
import { getDbReadiness } from '@/lib/dbReadiness';

let cached: { checkedAt: number; setupComplete: boolean } | null = null;

export async function isSetupComplete(): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.checkedAt < 2000) {
    return cached.setupComplete;
  }

  const readiness = await getDbReadiness(prisma);
  const setupComplete = readiness.ready && readiness.userCount > 0;
  cached = { checkedAt: now, setupComplete };
  return setupComplete;
}
