const prismaUserCountMock = jest.fn();
const prismaUserCreateMock = jest.fn();

const hashPasswordMock = jest.fn();
const createAuthJwtMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => prismaUserCountMock(...args),
      create: (...args: unknown[]) => prismaUserCreateMock(...args),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: (...args: unknown[]) => hashPasswordMock(...args),
  createAuthJwt: (...args: unknown[]) => createAuthJwtMock(...args),
  getAuthCookieName: () => 'webcore_auth',
  getDefaultAuthMaxAgeSeconds: () => 60,
  getJwtSecret: () => 'test-secret',
}));

import { POST } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('POST /api/auth/setup', () => {
  beforeEach(() => {
    prismaUserCountMock.mockReset();
    prismaUserCreateMock.mockReset();
    hashPasswordMock.mockReset();
    createAuthJwtMock.mockReset();
  });

  it('returns 409 when already initialized', async () => {
    prismaUserCountMock.mockResolvedValueOnce(1);

    const res = await POST(
      makeJsonRequest({ name: 'Admin', email: 'a@a.com', password: '1234567890' })
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: 'Already initialized' });
  });

  it('returns 400 on invalid payload', async () => {
    prismaUserCountMock.mockResolvedValueOnce(0);

    const res = await POST(makeJsonRequest({ email: 'not-email' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid payload');
  });

  it('creates SUPER_ADMIN and sets auth cookie', async () => {
    prismaUserCountMock.mockResolvedValueOnce(0);
    hashPasswordMock.mockResolvedValueOnce('hashed');

    prismaUserCreateMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'SUPER_ADMIN',
      sessionVersion: 1,
    });

    createAuthJwtMock.mockResolvedValueOnce('jwt');

    const res = await POST(
      makeJsonRequest({ name: 'Admin', email: 'admin@example.com', password: '1234567890' })
    );

    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('webcore_auth=jwt');
    expect(setCookie).toContain('HttpOnly');
  });
});
