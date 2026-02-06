const getSessionUserFromRequestMock = jest.fn();
const roleAtLeastMock = jest.fn();

const prismaInviteFindManyMock = jest.fn();
const prismaUserFindUniqueMock = jest.fn();
const prismaTransactionMock = jest.fn();

const generateInviteTokenMock = jest.fn();
const sha256Base64UrlMock = jest.fn();
const getAppBaseUrlMock = jest.fn();
const hashPasswordMock = jest.fn();

jest.mock('@/lib/session', () => ({
  getSessionUserFromRequest: (...args: unknown[]) => getSessionUserFromRequestMock(...args),
  roleAtLeast: (...args: unknown[]) => roleAtLeastMock(...args),
}));

jest.mock('@/lib/invites', () => ({
  generateInviteToken: (...args: unknown[]) => generateInviteTokenMock(...args),
  sha256Base64Url: (...args: unknown[]) => sha256Base64UrlMock(...args),
  getAppBaseUrl: (...args: unknown[]) => getAppBaseUrlMock(...args),
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: (...args: unknown[]) => hashPasswordMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    userInvite: {
      findMany: (...args: unknown[]) => prismaInviteFindManyMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

import { GET, POST } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('admin user invites', () => {
  beforeEach(() => {
    getSessionUserFromRequestMock.mockReset();
    roleAtLeastMock.mockReset();
    prismaInviteFindManyMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
    prismaTransactionMock.mockReset();
    generateInviteTokenMock.mockReset();
    sha256Base64UrlMock.mockReset();
    getAppBaseUrlMock.mockReset();
    hashPasswordMock.mockReset();
  });

  describe('GET /api/admin/users/invites', () => {
    it('returns 401 when unauthenticated', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce(null);
      const res = await GET(makeJsonRequest(null));
      expect(res.status).toBe(401);
    });

    it('returns 403 when not SUPER_ADMIN', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'ADMIN' });
      roleAtLeastMock.mockReturnValueOnce(false);
      const res = await GET(makeJsonRequest(null));
      expect(res.status).toBe(403);
    });

    it('returns invites with count', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN' });
      roleAtLeastMock.mockReturnValueOnce(true);

      prismaInviteFindManyMock.mockResolvedValueOnce([
        {
          id: 'inv1',
          email: 'new@example.com',
          name: 'New',
          role: 'USER',
          expiresAt: new Date('2025-01-02T00:00:00Z'),
          createdAt: new Date('2025-01-01T00:00:00Z'),
          claimedAt: null,
          createdByUserId: 'u1',
          claimedByUserId: null,
        },
      ]);

      const res = await GET(makeJsonRequest(null));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.count).toBe(1);
      expect(json.data[0].id).toBe('inv1');
    });
  });

  describe('POST /api/admin/users/invites', () => {
    it('returns 400 on invalid payload', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN' });
      roleAtLeastMock.mockReturnValueOnce(true);

      const res = await POST(makeJsonRequest({ email: 'not-an-email' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid payload');
    });

    it('returns 409 when email already exists', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN' });
      roleAtLeastMock.mockReturnValueOnce(true);
      prismaUserFindUniqueMock.mockResolvedValueOnce({ id: 'existing' });

      const res = await POST(
        makeJsonRequest({ name: 'New', email: 'new@example.com', role: 'USER' })
      );
      expect(res.status).toBe(409);
      await expect(res.json()).resolves.toEqual({ error: 'Email already exists' });
    });

    it('creates invite and returns inviteUrl + expiresAt', async () => {
      getSessionUserFromRequestMock.mockResolvedValueOnce({ id: 'u1', role: 'SUPER_ADMIN' });
      roleAtLeastMock.mockReturnValueOnce(true);
      prismaUserFindUniqueMock.mockResolvedValueOnce(null);

      generateInviteTokenMock.mockReturnValueOnce('token123'); // token
      sha256Base64UrlMock.mockResolvedValueOnce('sha256token');
      generateInviteTokenMock.mockReturnValueOnce('placeholderpassword'); // placeholder password
      hashPasswordMock.mockResolvedValueOnce('hashed');
      getAppBaseUrlMock.mockReturnValueOnce('https://app.example.com/');

      prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue({ id: 'newUser' }) },
          userInvite: { create: jest.fn().mockResolvedValue({ id: 'inv1' }) },
        };
        return fn(tx);
      });

      const res = await POST(
        makeJsonRequest({ name: 'New', email: 'new@example.com', role: 'USER', expiresInHours: 1 })
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.inviteUrl).toBe('https://app.example.com/invite?token=token123');
      expect(typeof json.expiresAt).toBe('string');
    });
  });
});
