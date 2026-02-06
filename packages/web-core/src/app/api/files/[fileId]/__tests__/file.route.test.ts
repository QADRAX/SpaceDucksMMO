const prismaFileFindUniqueMock = jest.fn();

const storageFileExistsMock = jest.fn();
const storageCreateReadStreamMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    fileAsset: {
      findUnique: (...args: unknown[]) => prismaFileFindUniqueMock(...args),
    },
  },
}));

jest.mock('@/lib/storage', () => ({
  StorageService: {
    fileExists: (...args: unknown[]) => storageFileExistsMock(...args),
    createReadStream: (...args: unknown[]) => storageCreateReadStreamMock(...args),
  },
}));

import { GET } from '../route';
import { makeContext, makeJsonRequest } from '@/test-utils/route';

describe('GET /api/files/{fileId}', () => {
  beforeEach(() => {
    prismaFileFindUniqueMock.mockReset();
    storageFileExistsMock.mockReset();
    storageCreateReadStreamMock.mockReset();
  });

  it('returns 404 when file asset not found', async () => {
    prismaFileFindUniqueMock.mockResolvedValueOnce(null);

    const res = await GET(makeJsonRequest(null), makeContext({ fileId: 'f1' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'File not found' });
  });

  it('returns 404 when blob missing', async () => {
    prismaFileFindUniqueMock.mockResolvedValueOnce({
      id: 'f1',
      storagePath: 'files/f1/a.bin',
    });

    storageFileExistsMock.mockResolvedValueOnce(false);

    const res = await GET(makeJsonRequest(null), makeContext({ fileId: 'f1' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'File blob missing' });
  });

  it('returns stream response with headers when blob exists', async () => {
    prismaFileFindUniqueMock.mockResolvedValueOnce({
      id: 'f1',
      storagePath: 'files/f1/a.bin',
      contentType: 'application/octet-stream',
      sha256: 'abc',
    });

    storageFileExistsMock.mockResolvedValueOnce(true);
    storageCreateReadStreamMock.mockReturnValueOnce({} as any);

    const res = await GET(makeJsonRequest(null), makeContext({ fileId: 'f1' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
    expect(res.headers.get('etag')).toBe('"abc"');
  });
});
