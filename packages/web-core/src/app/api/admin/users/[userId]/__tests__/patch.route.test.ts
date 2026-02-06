const getSessionUserFromRequestMock = jest.fn();
const roleAtLeastMock = jest.fn();

const prismaFindUniqueMock = jest.fn();
const prismaCountMock = jest.fn();
const prismaUpdateMock = jest.fn();

jest.mock('@/lib/session', () => ({
  getSessionUserFromRequest: (...args: unknown[]) => getSessionUserFromRequestMock(...args),
  roleAtLeast: (...args: unknown[]) => roleAtLeastMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => prismaFindUniqueMock(...args),
      count: (...args: unknown[]) => prismaCountMock(...args),
      update: (...args: unknown[]) => prismaUpdateMock(...args),
    },
  },
}));

import { PATCH } from '../route';

type Actor = {
  id: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
};

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as any;
}

function makeContext(userId: string) {
  return {
    params: Promise.resolve({ userId }),
  } as any;
}

describe('PATCH /api/admin/users/{userId}', () => {
  beforeEach(() => {
    getSessionUserFromRequestMock.mockReset();
    roleAtLeastMock.mockReset();
    prismaFindUniqueMock.mockReset();
    prismaCountMock.mockReset();
    prismaUpdateMock.mockReset();

    roleAtLeastMock.mockImplementation((role: string, required: string) => role === required);
  });

  it('returns 401 when unauthenticated', async () => {
    getSessionUserFromRequestMock.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({ name: 'Someone' }), makeContext('u2'));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when not SUPER_ADMIN', async () => {
    const actor: Actor = { id: 'u1', role: 'ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(false);

    const res = await PATCH(makeRequest({ name: 'Someone' }), makeContext('u2'));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns 400 on invalid payload', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    const res = await PATCH(makeRequest({ role: 'SUPER_ADMIN' }), makeContext('u2'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid payload');
  });

  it('blocks disabling yourself', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    const res = await PATCH(makeRequest({ isActive: false }), makeContext('u1'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot disable yourself' });
  });

  it('blocks changing your own role', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    const res = await PATCH(makeRequest({ role: 'ADMIN' }), makeContext('u1'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot change your own role' });
  });

  it('returns 404 when target not found (deactivate/demote path)', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);
    prismaFindUniqueMock.mockResolvedValueOnce(null);

    const res = await PATCH(makeRequest({ isActive: false }), makeContext('missing'));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Not found' });
  });

  it('blocks removing the last SUPER_ADMIN by demotion', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    prismaFindUniqueMock.mockResolvedValueOnce({ id: 'u2', role: 'SUPER_ADMIN', isActive: true });
    prismaCountMock.mockResolvedValueOnce(1);

    const res = await PATCH(makeRequest({ role: 'ADMIN' }), makeContext('u2'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot remove the last super admin' });
  });

  it('blocks removing the last SUPER_ADMIN by deactivation', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    prismaFindUniqueMock.mockResolvedValueOnce({ id: 'u2', role: 'SUPER_ADMIN', isActive: true });
    prismaCountMock.mockResolvedValueOnce(1);

    const res = await PATCH(makeRequest({ isActive: false }), makeContext('u2'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot remove the last super admin' });
  });

  it('allows demoting SUPER_ADMIN when there are multiple', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    prismaFindUniqueMock.mockResolvedValueOnce({ id: 'u2', role: 'SUPER_ADMIN', isActive: true });
    prismaCountMock.mockResolvedValueOnce(2);

    prismaUpdateMock.mockResolvedValueOnce({
      id: 'u2',
      email: 'u2@example.com',
      name: 'U2',
      role: 'ADMIN',
      isActive: true,
      sessionVersion: 1,
      lastLoginAt: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    });

    const res = await PATCH(makeRequest({ role: 'ADMIN' }), makeContext('u2'));
    expect(res.status).toBe(200);

    expect(prismaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({ role: 'ADMIN' }),
      })
    );

    const json = await res.json();
    expect(json.role).toBe('ADMIN');
  });

  it('increments sessionVersion when disabling a user', async () => {
    const actor: Actor = { id: 'u1', role: 'SUPER_ADMIN' };
    getSessionUserFromRequestMock.mockResolvedValueOnce(actor);
    roleAtLeastMock.mockReturnValueOnce(true);

    prismaFindUniqueMock.mockResolvedValueOnce({ id: 'u2', role: 'ADMIN', isActive: true });

    prismaUpdateMock.mockResolvedValueOnce({
      id: 'u2',
      email: 'u2@example.com',
      name: 'U2',
      role: 'ADMIN',
      isActive: false,
      sessionVersion: 2,
      lastLoginAt: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    });

    const res = await PATCH(makeRequest({ isActive: false }), makeContext('u2'));
    expect(res.status).toBe(200);

    expect(prismaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({
          isActive: false,
          sessionVersion: { increment: 1 },
        }),
      })
    );
  });
});
