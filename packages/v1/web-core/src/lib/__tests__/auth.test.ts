import { createAuthJwt, getDefaultAuthMaxAgeSeconds, verifyAuthJwt } from '@/lib/auth';

describe('auth jwt', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates and verifies a valid token', async () => {
    const secret = 'test-secret';
    const now = Math.floor(Date.now() / 1000);

    const token = await createAuthJwt(
      {
        sub: 'user_1',
        email: 'user@example.com',
        name: 'User',
        role: 'SUPER_ADMIN',
        sv: 1,
        iat: now,
        exp: now + 60,
      },
      secret
    );

    const payload = await verifyAuthJwt(token, secret);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user_1');
    expect(payload?.role).toBe('SUPER_ADMIN');
  });

  it('rejects a token with bad signature', async () => {
    const secret = 'test-secret';
    const now = Math.floor(Date.now() / 1000);

    const token = await createAuthJwt(
      {
        sub: 'user_1',
        email: 'user@example.com',
        name: 'User',
        role: 'ADMIN',
        sv: 1,
        iat: now,
        exp: now + 60,
      },
      secret
    );

    const tampered = token.replace(/\.[^.]+$/, '.aaaaaaaa');
    expect(await verifyAuthJwt(tampered, secret)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const secret = 'test-secret';
    const now = Math.floor(Date.now() / 1000);

    const token = await createAuthJwt(
      {
        sub: 'user_1',
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
        sv: 1,
        iat: now - 120,
        exp: now - 60,
      },
      secret
    );

    expect(await verifyAuthJwt(token, secret)).toBeNull();
  });

  it('has a stable default max age', () => {
    expect(getDefaultAuthMaxAgeSeconds()).toBe(60 * 60 * 24 * 7);
  });
});
