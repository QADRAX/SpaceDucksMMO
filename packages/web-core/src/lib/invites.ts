function bytesToBase64Url(bytes: Uint8Array): string {
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

export function getAppBaseUrl(): string {
  return (
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000'
  );
}

export function generateInviteToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Base64Url(input: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  );
  return bytesToBase64Url(new Uint8Array(digest));
}
