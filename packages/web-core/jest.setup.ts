import { webcrypto } from 'node:crypto';

// Jest runs in Node; ensure WebCrypto is available for JWT HMAC code.
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = webcrypto as any;
}

jest.setTimeout(15_000);
