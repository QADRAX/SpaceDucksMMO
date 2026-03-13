jest.mock('@/lib/auth', () => ({
  getAuthCookieName: () => 'webcore_auth',
}));

import { GET } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('GET /api/auth/logout', () => {
  it('redirects to /login and clears cookie', async () => {
    const res = await GET(makeJsonRequest(null, { url: 'http://localhost/api/auth/logout' }));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');

    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('webcore_auth=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
