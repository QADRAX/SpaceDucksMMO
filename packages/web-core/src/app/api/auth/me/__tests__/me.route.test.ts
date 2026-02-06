const verifyAuthJwtMock = jest.fn();
const prismaUserFindUniqueMock = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthCookieName: () => 'webcore_auth',
  getJwtSecret: () => 'test-secret',
  verifyAuthJwt: (...args: unknown[]) => verifyAuthJwtMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
    },
  },
}));

import { GET } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    verifyAuthJwtMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  it('returns user:null when no cookie', async () => {
    const res = await GET(makeJsonRequest(null, { cookies: {} }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns user:null when jwt invalid', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce(null);

    const res = await GET(makeJsonRequest(null, { cookies: { webcore_auth: 'token' } }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns user:null when user not found/inactive', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce({ sub: 'u1' });
    prismaUserFindUniqueMock.mockResolvedValueOnce({ id: 'u1', isActive: false });

    const res = await GET(makeJsonRequest(null, { cookies: { webcore_auth: 'token' } }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ user: null });
  });

  it('returns user when valid', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce({ sub: 'u1' });
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'ADMIN',
      isActive: true,
    });

    const res = await GET(makeJsonRequest(null, { cookies: { webcore_auth: 'token' } }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user.email).toBe('u1@example.com');
  });
});
