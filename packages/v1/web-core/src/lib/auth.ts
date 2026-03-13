/**
 * Authentication utilities
 *
 * - Users are stored locally in SQLite via Prisma.
 * - Auth uses an HttpOnly cookie containing a signed JWT (HS256).
 * - RBAC is based on the role embedded in the token, validated against DB state.
 */

import bcrypt from 'bcryptjs';

const AUTH_COOKIE_NAME = 'webcore_auth';

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

export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

export function getJwtSecret(): string {
  // Recommended: set AUTH_JWT_SECRET to a long random string.
  // Fallbacks for local dev only.
  return process.env.AUTH_JWT_SECRET || 'changeme';
}

export type AuthJwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  sv: number;
  iat: number;
  exp: number;
};

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createAuthJwt(payload: AuthJwtPayload, secret: string): Promise<string> {
  const headerB64 = utf8ToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadB64 = utf8ToBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sigB64 = await hmacSha256Base64Url(secret, signingInput);
  return `${signingInput}.${sigB64}`;
}

export async function verifyAuthJwt(
  token: string | null,
  secret: string
): Promise<AuthJwtPayload | null> {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  const expectedSig = await hmacSha256Base64Url(secret, `${headerB64}.${payloadB64}`);
  if (!timingSafeEqual(sigB64, expectedSig)) return null;

  let payload: AuthJwtPayload;
  try {
    payload = JSON.parse(base64UrlToUtf8(payloadB64)) as AuthJwtPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload.sub !== 'string') return null;
  if (typeof payload.email !== 'string' || typeof payload.name !== 'string') return null;
  if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN' && payload.role !== 'USER') return null;
  if (typeof payload.sv !== 'number') return null;
  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null;
  if (nowSeconds() > payload.exp) return null;

  return payload;
}

export function getDefaultAuthMaxAgeSeconds(): number {
  return 60 * 60 * 24 * 7; // 7 days
}
