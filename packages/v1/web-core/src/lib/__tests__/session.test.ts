const verifyAuthJwtMock = jest.fn();
const prismaFindUniqueMock = jest.fn();

jest.mock('@/lib/auth', () => ({
  getAuthCookieName: () => 'webcore_auth',
  getJwtSecret: () => 'test-secret',
  verifyAuthJwt: (...args: unknown[]) => verifyAuthJwtMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => prismaFindUniqueMock(...args),
    },
  },
}));

import { getSessionUserFromRequest, roleAtLeast } from '@/lib/session';

describe('session', () => {
  beforeEach(() => {
    verifyAuthJwtMock.mockReset();
    prismaFindUniqueMock.mockReset();
  });

  it('roleAtLeast enforces hierarchy', () => {
    expect(roleAtLeast('SUPER_ADMIN', 'ADMIN')).toBe(true);
    expect(roleAtLeast('ADMIN', 'USER')).toBe(true);
    expect(roleAtLeast('USER', 'ADMIN')).toBe(false);
  });

  it('returns null when cookie is missing', async () => {
    const request = {
      cookies: {
        get: () => undefined,
      },
    } as any;

    const user = await getSessionUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns null when JWT is invalid', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce(null);

    const request = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    } as any;

    const user = await getSessionUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns null when user is inactive', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce({
      sub: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'ADMIN',
      sv: 1,
      iat: 0,
      exp: 9999999999,
    });

    prismaFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'ADMIN',
      isActive: false,
      sessionVersion: 1,
    });

    const request = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    } as any;

    const user = await getSessionUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns null when session version mismatches', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce({
      sub: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'ADMIN',
      sv: 2,
      iat: 0,
      exp: 9999999999,
    });

    prismaFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'ADMIN',
      isActive: true,
      sessionVersion: 1,
    });

    const request = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    } as any;

    const user = await getSessionUserFromRequest(request);
    expect(user).toBeNull();
  });

  it('returns a session user when valid', async () => {
    verifyAuthJwtMock.mockResolvedValueOnce({
      sub: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'SUPER_ADMIN',
      sv: 1,
      iat: 0,
      exp: 9999999999,
    });

    prismaFindUniqueMock.mockResolvedValueOnce({
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'SUPER_ADMIN',
      isActive: true,
      sessionVersion: 1,
    });

    const request = {
      cookies: {
        get: () => ({ value: 'token' }),
      },
    } as any;

    const user = await getSessionUserFromRequest(request);

    expect(prismaFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } })
    );

    expect(user).toEqual({
      id: 'u1',
      email: 'u1@example.com',
      name: 'U1',
      role: 'SUPER_ADMIN',
      sessionVersion: 1,
    });
  });
});
