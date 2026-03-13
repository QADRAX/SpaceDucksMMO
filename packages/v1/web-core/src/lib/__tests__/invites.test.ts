import { createHash } from 'node:crypto';

import { generateInviteToken, getAppBaseUrl, sha256Base64Url } from '@/lib/invites';

describe('invites', () => {
  it('picks base URL from env', () => {
    const prevBase = process.env.BASE_URL;
    const prevPublic = process.env.NEXT_PUBLIC_API_URL;

    process.env.BASE_URL = 'https://example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://public.example.com';
    expect(getAppBaseUrl()).toBe('https://example.com');

    delete process.env.BASE_URL;
    process.env.NEXT_PUBLIC_API_URL = 'https://public.example.com';
    expect(getAppBaseUrl()).toBe('https://public.example.com');

    delete process.env.BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getAppBaseUrl()).toBe('http://localhost:3000');

    if (prevBase === undefined) delete process.env.BASE_URL;
    else process.env.BASE_URL = prevBase;

    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = prevPublic;
  });

  it('generates a base64url token', () => {
    const token = generateInviteToken(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThan(40);
  });

  it('sha256Base64Url matches Node crypto', async () => {
    const input = 'hello';
    const expected = createHash('sha256')
      .update(input)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    await expect(sha256Base64Url(input)).resolves.toBe(expected);
  });
});
