import { Prisma } from '@prisma/client';

export type DbReadiness =
  | { ready: true; userCount: number }
  | { ready: false; reason: 'missing-schema' | 'unknown'; message?: string };

function looksLikeMissingTableMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('no such table') ||
    m.includes('missing the table') ||
    m.includes('table `main.')
  );
}

export function isPrismaMissingSchemaError(err: unknown): boolean {
  if (!err) return false;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: The table does not exist in the current database.
    // P2022: The column does not exist in the current database.
    return err.code === 'P2021' || err.code === 'P2022';
  }

  if (err instanceof Error) {
    return looksLikeMissingTableMessage(err.message);
  }

  return false;
}

export async function getDbReadiness(prisma: { user: { count: () => Promise<number> } }): Promise<DbReadiness> {
  try {
    const userCount = await prisma.user.count();
    return { ready: true, userCount };
  } catch (err) {
    if (isPrismaMissingSchemaError(err)) {
      return {
        ready: false,
        reason: 'missing-schema',
        message: err instanceof Error ? err.message : undefined,
      };
    }

    return {
      ready: false,
      reason: 'unknown',
      message: err instanceof Error ? err.message : undefined,
    };
  }
}
