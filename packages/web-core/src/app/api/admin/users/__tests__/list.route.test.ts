const getSessionUserFromRequestMock = jest.fn();
const roleAtLeastMock = jest.fn();
const prismaFindManyMock = jest.fn();

jest.mock('@/lib/session', () => ({
  getSessionUserFromRequest: (...args: unknown[]) => getSessionUserFromRequestMock(...args),
  roleAtLeast: (...args: unknown[]) => roleAtLeastMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => prismaFindManyMock(...args),
    },
  },
}));

import { GET } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    getSessionUserFromRequestMock.mockReset();
    roleAtLeastMock.mockReset();
    prismaFindManyMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionUserFromRequestMock.mockResolvedValueOnce(null);

    const res = await GET(makeJsonRequest(null));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when not SUPER_ADMIN', async () => {
    getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'ADMIN' });
    roleAtLeastMock.mockReturnValueOnce(false);

    const res = await GET(makeJsonRequest(null));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns users with count', async () => {
    getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN' });
    roleAtLeastMock.mockReturnValueOnce(true);

    prismaFindManyMock.mockResolvedValueOnce([
      {
        id: 'u1',
        email: 'u1@example.com',
        name: 'U1',
        role: 'SUPER_ADMIN',
        isActive: true,
        sessionVersion: 1,
        lastLoginAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(makeJsonRequest(null));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.count).toBe(1);
    expect(json.data).toHaveLength(1);
    expect(prismaFindManyMock).toHaveBeenCalled();
  });
});
