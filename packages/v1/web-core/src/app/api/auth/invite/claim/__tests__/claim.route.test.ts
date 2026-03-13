const sha256Base64UrlMock = jest.fn();
const hashPasswordMock = jest.fn();
const createAuthJwtMock = jest.fn();

const prismaInviteFindUniqueMock = jest.fn();
const prismaUserFindUniqueMock = jest.fn();
const prismaTransactionMock = jest.fn();

jest.mock('@/lib/invites', () => ({
  sha256Base64Url: (...args: unknown[]) => sha256Base64UrlMock(...args),
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: (...args: unknown[]) => hashPasswordMock(...args),
  createAuthJwt: (...args: unknown[]) => createAuthJwtMock(...args),
  getAuthCookieName: () => 'webcore_auth',
  getDefaultAuthMaxAgeSeconds: () => 60,
  getJwtSecret: () => 'test-secret',
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    userInvite: {
      findUnique: (...args: unknown[]) => prismaInviteFindUniqueMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

import { POST } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('POST /api/auth/invite/claim', () => {
  beforeEach(() => {
    sha256Base64UrlMock.mockReset();
    hashPasswordMock.mockReset();
    createAuthJwtMock.mockReset();
    prismaInviteFindUniqueMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it('returns 400 on invalid payload', async () => {
    const res = await POST(makeJsonRequest({ token: 'short', password: 'short' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when invite invalid', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce(null);

    const res = await POST(makeJsonRequest({ token: 'token_1234567890', password: '1234567890' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid invite' });
  });

  it('returns 409 when invite already claimed', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() + 10000),
      claimedAt: new Date(),
    });

    const res = await POST(makeJsonRequest({ token: 'token_1234567890', password: '1234567890' }));
    expect(res.status).toBe(409);
  });

  it('returns 404 when expired', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() - 10000),
      claimedAt: null,
    });

    const res = await POST(makeJsonRequest({ token: 'token_1234567890', password: '1234567890' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invite expired' });
  });

  it('returns 404 when user not found for invite', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() + 10000),
      claimedAt: null,
    });

    prismaUserFindUniqueMock.mockResolvedValueOnce(null);

    const res = await POST(makeJsonRequest({ token: 'token_1234567890', password: '1234567890' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'User not found for invite' });
  });

  it('returns 409 when user already active', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() + 10000),
      claimedAt: null,
    });

    prismaUserFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'e',
      name: 'n',
      role: 'USER',
      isActive: true,
      sessionVersion: 1,
    });

    const res = await POST(makeJsonRequest({ token: 'token_1234567890', password: '1234567890' }));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: 'User already active' });
  });

  it('claims invite, activates user, and sets cookie', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');

    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() + 10000),
      claimedAt: null,
    });

    prismaUserFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'e',
      name: 'n',
      role: 'USER',
      isActive: false,
      sessionVersion: 1,
    });

    hashPasswordMock.mockResolvedValueOnce('hashed');

    prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          update: jest.fn().mockResolvedValue({
            id: 'u1',
            email: 'e',
            name: 'newname',
            role: 'USER',
            sessionVersion: 1,
          }),
        },
        userInvite: {
          update: jest.fn().mockResolvedValue({ id: 'i1' }),
        },
      };

      return fn(tx);
    });

    createAuthJwtMock.mockResolvedValueOnce('jwt');

    const res = await POST(
      makeJsonRequest({ token: 'token_1234567890', password: '1234567890', name: 'newname' })
    );

    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('webcore_auth=jwt');
  });
});
