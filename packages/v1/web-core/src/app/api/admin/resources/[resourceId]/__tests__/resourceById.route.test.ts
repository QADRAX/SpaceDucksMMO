const prismaResourceFindFirstMock = jest.fn();
const prismaResourceUpdateMock = jest.fn();
const prismaResourceDeleteMock = jest.fn();
const prismaResourceFindUniqueMock = jest.fn();

const prismaFileAssetFindManyMock = jest.fn();
const prismaFileAssetFindUniqueMock = jest.fn();
const prismaFileAssetDeleteMock = jest.fn();

const storageDeleteFileMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findFirst: (...args: unknown[]) => prismaResourceFindFirstMock(...args),
      update: (...args: unknown[]) => prismaResourceUpdateMock(...args),
      delete: (...args: unknown[]) => prismaResourceDeleteMock(...args),
      findUnique: (...args: unknown[]) => prismaResourceFindUniqueMock(...args),
    },
    fileAsset: {
      findMany: (...args: unknown[]) => prismaFileAssetFindManyMock(...args),
      findUnique: (...args: unknown[]) => prismaFileAssetFindUniqueMock(...args),
      delete: (...args: unknown[]) => prismaFileAssetDeleteMock(...args),
    },
  },
}));

jest.mock('@/lib/storage', () => ({
  StorageService: {
    deleteFile: (...args: unknown[]) => storageDeleteFileMock(...args),
  },
}));

import { DELETE, GET, PATCH } from '../route';
import { makeContext, makeJsonRequest } from '@/test-utils/route';

describe('resource by id', () => {
  beforeEach(() => {
    prismaResourceFindFirstMock.mockReset();
    prismaResourceUpdateMock.mockReset();
    prismaResourceDeleteMock.mockReset();
    prismaResourceFindUniqueMock.mockReset();
    prismaFileAssetFindManyMock.mockReset();
    prismaFileAssetFindUniqueMock.mockReset();
    prismaFileAssetDeleteMock.mockReset();
    storageDeleteFileMock.mockReset();
  });

  describe('GET /api/admin/resources/{resourceId}', () => {
    it('returns 404 when not found', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce(null);
      const res = await GET(makeJsonRequest(null), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: 'Resource not found' });
    });

    it('returns resource with versions', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', versions: [] });
      const res = await GET(makeJsonRequest(null), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe('r1');
    });
  });

  describe('PATCH /api/admin/resources/{resourceId}', () => {
    it('returns 400 when payload invalid', async () => {
      const res = await PATCH(makeJsonRequest({ displayName: '' }), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid payload');
    });

    it('returns 400 when no changes', async () => {
      const res = await PATCH(makeJsonRequest({}), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'No changes' });
    });

    it('updates displayName', async () => {
      prismaResourceUpdateMock.mockResolvedValueOnce({ id: 'r1', displayName: 'New' });
      const res = await PATCH(
        makeJsonRequest({ displayName: 'New' }),
        makeContext({ resourceId: 'r1' })
      );
      expect(res.status).toBe(200);
      expect(prismaResourceUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r1' }, data: { displayName: 'New' } })
      );
    });
  });

  describe('DELETE /api/admin/resources/{resourceId}', () => {
    it('returns 404 when prisma delete throws', async () => {
      prismaResourceFindUniqueMock.mockResolvedValueOnce(null);
      prismaFileAssetFindManyMock.mockResolvedValueOnce([]);
      prismaResourceDeleteMock.mockRejectedValueOnce(new Error('Record does not exist'));

      const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'missing' }));
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('Record');
    });

    it('deletes orphan file assets and blobs best-effort', async () => {
      prismaResourceFindUniqueMock.mockResolvedValueOnce({ thumbnailFileAssetId: 'thumb1' });

      prismaFileAssetFindManyMock
        // candidates (bindings)
        .mockResolvedValueOnce([
          { id: 'fa1', storagePath: 'files/fa1/a.bin' },
          { id: 'fa2', storagePath: 'files/fa2/b.bin' },
        ])
        // orphans (after delete)
        .mockResolvedValueOnce([
          { id: 'fa2', storagePath: 'files/fa2/b.bin' },
          { id: 'thumb1', storagePath: 'files/thumb1/t.png' },
        ]);

      prismaFileAssetFindUniqueMock.mockResolvedValueOnce({ id: 'thumb1', storagePath: 'files/thumb1/t.png' });
      prismaResourceDeleteMock.mockResolvedValueOnce({ id: 'r1' });

      prismaFileAssetDeleteMock.mockResolvedValue(null);
      storageDeleteFileMock.mockResolvedValue(undefined);

      const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(200);

      expect(storageDeleteFileMock).toHaveBeenCalledTimes(2);
      expect(prismaFileAssetDeleteMock).toHaveBeenCalledTimes(2);
    });
  });
});
