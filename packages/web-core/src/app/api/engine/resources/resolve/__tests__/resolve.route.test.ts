const prismaResourceFindFirstMock = jest.fn();
const prismaResourceVersionFindUniqueMock = jest.fn();
const prismaResourceVersionFindFirstMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findFirst: (...args: unknown[]) => prismaResourceFindFirstMock(...args),
    },
    resourceVersion: {
      findUnique: (...args: unknown[]) => prismaResourceVersionFindUniqueMock(...args),
      findFirst: (...args: unknown[]) => prismaResourceVersionFindFirstMock(...args),
    },
  },
}));

import { GET } from '../route';
import { makeJsonRequest } from '@/test-utils/route';

describe('GET /api/engine/resources/resolve', () => {
  beforeEach(() => {
    prismaResourceFindFirstMock.mockReset();
    prismaResourceVersionFindUniqueMock.mockReset();
    prismaResourceVersionFindFirstMock.mockReset();

    delete process.env.BASE_URL;
  });

  it('returns 400 when missing key', async () => {
    const res = await GET(makeJsonRequest(null, { url: 'http://localhost/api/engine/resources/resolve' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing key' });
  });

  it('returns 404 when resource not found', async () => {
    prismaResourceFindFirstMock.mockResolvedValueOnce(null);

    const res = await GET(
      makeJsonRequest(null, { url: 'http://localhost/api/engine/resources/resolve?key=k1' })
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Resource not found' });
  });

  it('resolves active version and builds file urls', async () => {
    prismaResourceFindFirstMock.mockResolvedValueOnce({
      id: 'r1',
      key: 'k1',
      activeVersion: 2,
    });

    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({
      version: 2,
      componentType: 'standardMaterial',
      componentData: '{"color":"#fff"}',
      bindings: [
        {
          slot: 'albedoMap',
          fileAsset: {
            id: 'f1',
            fileName: 'a.png',
            contentType: 'image/png',
            size: 1,
            sha256: 'abc',
          },
        },
      ],
    });

    const res = await GET(
      makeJsonRequest(null, {
        url: 'http://myhost:3000/api/engine/resources/resolve?key=k1&version=active',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.key).toBe('k1');
    expect(json.version).toBe(2);
    expect(json.files.albedoMap.url).toBe('http://myhost:3000/api/files/f1');
  });

  it('returns 404 when selected version not found', async () => {
    prismaResourceFindFirstMock.mockResolvedValueOnce({
      id: 'r1',
      key: 'k1',
      activeVersion: 2,
    });

    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce(null);
    prismaResourceVersionFindFirstMock.mockResolvedValueOnce(null);

    const res = await GET(
      makeJsonRequest(null, {
        url: 'http://localhost/api/engine/resources/resolve?key=k1&version=active',
      })
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Version not found' });
  });

  it('supports explicit numeric version', async () => {
    prismaResourceFindFirstMock.mockResolvedValueOnce({
      id: 'r1',
      key: 'k1',
      activeVersion: 2,
    });

    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({
      version: 1,
      componentType: 'standardMaterial',
      componentData: '{}',
      bindings: [],
    });

    const res = await GET(
      makeJsonRequest(null, {
        url: 'http://localhost/api/engine/resources/resolve?key=k1&version=1',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.version).toBe(1);
  });
});
