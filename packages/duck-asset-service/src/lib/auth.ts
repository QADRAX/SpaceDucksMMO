/**
 * Basic Authentication utilities
 */

export function parseBasicAuth(authHeader: string | null): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
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

export function createUnauthorizedResponse(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="duck-assets"',
    },
  });
}
