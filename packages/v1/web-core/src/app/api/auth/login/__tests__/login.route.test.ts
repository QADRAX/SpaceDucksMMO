const prismaUserCountMock = jest.fn();
const prismaUserFindUniqueMock = jest.fn();
const prismaUserUpdateMock = jest.fn();

const verifyPasswordMock = jest.fn();
const createAuthJwtMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => prismaUserCountMock(...args),
      findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
      update: (...args: unknown[]) => prismaUserUpdateMock(...args),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyPassword: (...args: unknown[]) => verifyPasswordMock(...args),
  createAuthJwt: (...args: unknown[]) => createAuthJwtMock(...args),
  getAuthCookieName: () => 'webcore_auth',
  getDefaultAuthMaxAgeSeconds: () => 60,
  getJwtSecret: () => 'test-secret',
}));

import { POST } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    prismaUserCountMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
    prismaUserUpdateMock.mockReset();
    verifyPasswordMock.mockReset();
    createAuthJwtMock.mockReset();
  });

  it('returns 400 when missing credentials', async () => {
    const res = await POST(makeJsonRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing credentials' });
  });

  it('returns 409 when setup required', async () => {
    prismaUserCountMock.mockResolvedValueOnce(0);

    const res = await POST(makeJsonRequest({ email: 'a@a.com', password: 'pw' }));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: 'Setup required' });
  });

  it('returns 401 when user not found or inactive', async () => {
    prismaUserCountMock.mockResolvedValueOnce(1);
    prismaUserFindUniqueMock.mockResolvedValueOnce(null);

    const res = await POST(makeJsonRequest({ email: 'a@a.com', password: 'pw' }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid credentials' });
  });

  it('returns 401 when password invalid', async () => {
    prismaUserCountMock.mockResolvedValueOnce(1);
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@a.com',
      name: 'A',
      role: 'ADMIN',
      isActive: true,
      passwordHash: 'hash',
      sessionVersion: 1,
    });
    verifyPasswordMock.mockResolvedValueOnce(false);

    const res = await POST(makeJsonRequest({ email: 'a@a.com', password: 'pw' }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid credentials' });
  });

  it('sets cookie when login ok', async () => {
    prismaUserCountMock.mockResolvedValueOnce(1);
    prismaUserFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@a.com',
      name: 'A',
      role: 'ADMIN',
      isActive: true,
      passwordHash: 'hash',
      sessionVersion: 1,
    });
    verifyPasswordMock.mockResolvedValueOnce(true);
    createAuthJwtMock.mockResolvedValueOnce('jwt');
    prismaUserUpdateMock.mockResolvedValueOnce({ id: 'u1' });

    const res = await POST(makeJsonRequest({ email: 'A@A.COM', password: 'pw' }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('webcore_auth=jwt');
    expect(setCookie).toContain('HttpOnly');
  });
});
