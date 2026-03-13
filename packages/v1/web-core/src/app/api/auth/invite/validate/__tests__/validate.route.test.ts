const sha256Base64UrlMock = jest.fn();
const prismaInviteFindUniqueMock = jest.fn();
const prismaUserFindUniqueMock = jest.fn();

jest.mock('@/lib/invites', () => ({
  sha256Base64Url: (...args: unknown[]) => sha256Base64UrlMock(...args),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    userInvite: {
      findUnique: (...args: unknown[]) => prismaInviteFindUniqueMock(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => prismaUserFindUniqueMock(...args),
    },
  },
}));

import { GET } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('GET /api/auth/invite/validate', () => {
  beforeEach(() => {
    sha256Base64UrlMock.mockReset();
    prismaInviteFindUniqueMock.mockReset();
    prismaUserFindUniqueMock.mockReset();
  });

  it('returns 400 when missing token', async () => {
    const res = await GET(makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when invite invalid', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce(null);

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate?token=tok' })
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid invite' });
  });

  it('returns 409 when already claimed', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date(Date.now() + 10000),
      claimedAt: new Date(),
    });

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate?token=tok' })
    );
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

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate?token=tok' })
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Invite expired' });
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

    prismaUserFindUniqueMock.mockResolvedValueOnce({ id: 'u1', isActive: true });

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate?token=tok' })
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: 'User already active' });
  });

  it('returns ok:true + invite when valid', async () => {
    sha256Base64UrlMock.mockResolvedValueOnce('sha');
    prismaInviteFindUniqueMock.mockResolvedValueOnce({
      id: 'i1',
      email: 'e',
      name: 'n',
      role: 'USER',
      expiresAt: new Date('2999-01-01T00:00:00Z'),
      claimedAt: null,
    });

    prismaUserFindUniqueMock.mockResolvedValueOnce({ id: 'u1', isActive: false });

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/auth/invite/validate?token=tok' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.invite.email).toBe('e');
    expect(json.invite.expiresAt).toBe('2999-01-01T00:00:00.000Z');
  });
});
