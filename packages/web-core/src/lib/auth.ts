/**
 * Authentication utilities
 *
 * - Supports legacy HTTP Basic auth (useful for curl/CLI).
 * - Adds cookie-based sessions (preferred for browser SPAs; avoids relying on the browser Basic Auth prompt).
 */

const SESSION_COOKIE_NAME = 'webcore_admin_session';

function base64ToUtf8(base64: string): string {
  // Prefer Web APIs (Edge runtime), fallback to Buffer (Node).
  if (typeof globalThis.atob === 'function') {
    // atob returns a binary string; credentials are ASCII/utf-8-safe.
    return globalThis.atob(base64);
  }

  // eslint-disable-next-line no-undef
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function utf8ToBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);

  let base64: string;
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    base64 = globalThis.btoa(binary);
  } else {
    // eslint-disable-next-line no-undef
    base64 = Buffer.from(bytes).toString('base64');
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  let bytes: Uint8Array;
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(padded);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } else {
    // eslint-disable-next-line no-undef
    bytes = new Uint8Array(Buffer.from(padded, 'base64'));
  }

  return new TextDecoder().decode(bytes);
}

async function hmacSha256Base64Url(secret: string, data: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(sig);

  let base64: string;
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    base64 = globalThis.btoa(binary);
  } else {
    // eslint-disable-next-line no-undef
    base64 = Buffer.from(bytes).toString('base64');
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function parseBasicAuth(authHeader: string | null): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = base64ToUtf8(base64Credentials);
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch (error) {
    return null;
  }
}

export function verifyBasicAuth(authHeader: string | null): boolean {
  const credentials = parseBasicAuth(authHeader);
  
  if (!credentials) {
    return false;
  }

  const expectedUsername = process.env.ASSET_ADMIN_USER || 'admin';
  const expectedPassword = process.env.ASSET_ADMIN_PASS || 'changeme';

  return credentials.username === expectedUsername && credentials.password === expectedPassword;
}

export function getAdminAuthUserPass(): { username: string; password: string } {
  return {
    username: process.env.ASSET_ADMIN_USER || 'admin',
    password: process.env.ASSET_ADMIN_PASS || 'changeme',
  };
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionSecret(): string {
  // Prefer an explicit session secret; fall back to the admin password for convenience.
  // Recommended: set ASSET_ADMIN_SESSION_SECRET to a long random string.
  return process.env.ASSET_ADMIN_SESSION_SECRET || process.env.ASSET_ADMIN_PASS || 'changeme';
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expected = getAdminAuthUserPass();
  return username === expected.username && password === expected.password;
}

export type AdminSessionPayload = {
  u: string;
  iat: number;
  exp: number;
};

export async function createAdminSessionToken(
  payload: AdminSessionPayload,
  secret: string
): Promise<string> {
  const payloadB64 = utf8ToBase64Url(JSON.stringify(payload));
  const sigB64 = await hmacSha256Base64Url(secret, payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminSessionToken(
  token: string | null,
  secret: string
): Promise<AdminSessionPayload | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = await hmacSha256Base64Url(secret, payloadB64);
  if (!timingSafeEqual(sigB64, expectedSig)) return null;

  let payload: AdminSessionPayload;
  try {
    payload = JSON.parse(base64UrlToUtf8(payloadB64)) as AdminSessionPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload.u !== 'string') return null;
  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null;
  if (Date.now() > payload.exp) return null;

  return payload;
}
