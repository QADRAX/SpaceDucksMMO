const prismaResourceFindFirstMock = jest.fn();
const prismaResourceVersionFindManyMock = jest.fn();
const prismaResourceVersionFindFirstMock = jest.fn();
const prismaResourceVersionFindUniqueMock = jest.fn();
const prismaTransactionMock = jest.fn();

const createResourceVersionFromZipMock = jest.fn();
const updateResourceThumbnailFromVersionMock = jest.fn();
const storageSaveFileMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findFirst: (...args: unknown[]) => prismaResourceFindFirstMock(...args),
    },
    resourceVersion: {
      findMany: (...args: unknown[]) => prismaResourceVersionFindManyMock(...args),
      findFirst: (...args: unknown[]) => prismaResourceVersionFindFirstMock(...args),
      findUnique: (...args: unknown[]) => prismaResourceVersionFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

jest.mock('@/lib/resourceUpload/resourceZip', () => ({
  createResourceVersionFromZip: (...args: unknown[]) => createResourceVersionFromZipMock(...args),
}));

jest.mock('@/lib/resourceThumbnail', () => ({
  updateResourceThumbnailFromVersion: (...args: unknown[]) => updateResourceThumbnailFromVersionMock(...args),
}));

jest.mock('@/lib/storage', () => ({
  StorageService: {
    saveFile: (...args: unknown[]) => storageSaveFileMock(...args),
  },
}));

import { GET, POST } from '../route';
import { makeContext, makeFormDataRequest, makeJsonRequest } from '@/test-utils/route';

describe('resource versions', () => {
  beforeEach(() => {
    prismaResourceFindFirstMock.mockReset();
    prismaResourceVersionFindManyMock.mockReset();
    prismaResourceVersionFindFirstMock.mockReset();
    prismaResourceVersionFindUniqueMock.mockReset();
    prismaTransactionMock.mockReset();
    createResourceVersionFromZipMock.mockReset();
    updateResourceThumbnailFromVersionMock.mockReset();
    storageSaveFileMock.mockReset();
  });

  describe('GET /api/admin/resources/{resourceId}/versions', () => {
    it('returns versions with count', async () => {
      prismaResourceVersionFindManyMock.mockResolvedValueOnce([{ id: 'v2' }, { id: 'v1' }]);

      const res = await GET(makeJsonRequest(null), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.count).toBe(2);
      expect(json.data).toHaveLength(2);
    });
  });

  describe('POST /api/admin/resources/{resourceId}/versions', () => {
    it('returns 404 when resource not found', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce(null);
      const fd = new FormData();
      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'missing' }));
      expect(res.status).toBe(404);
    });

    it('returns 415 when not multipart/form-data', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });

      const res = await POST(
        makeJsonRequest({}, { headers: { 'content-type': 'application/json' } }),
        makeContext({ resourceId: 'r1' })
      );

      expect(res.status).toBe(415);
    });

    it('creates version from ZIP when zip is provided', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });

      const fd = new FormData();
      const zip = new File([new Uint8Array([1])], 'ver.zip', { type: 'application/zip' });
      fd.set('zip', zip);

      createResourceVersionFromZipMock.mockResolvedValueOnce({ id: 'v2', version: 2 });

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(201);
      expect(createResourceVersionFromZipMock).toHaveBeenCalled();
    });

    it('returns 400 when componentData is invalid JSON', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });

      const fd = new FormData();
      fd.set('componentData', '{');

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'componentData must be valid JSON (or omitted)' });
    });

    it('returns 400 when componentType mismatches kind', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });

      const fd = new FormData();
      fd.set('componentType', 'phongMaterial');

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'componentType must match resource kind' });
    });

    it('returns 409 when explicit nextVersion already exists', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });

      prismaResourceVersionFindFirstMock.mockResolvedValueOnce({ version: 1 });
      prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({ id: 'existing' });

      const fd = new FormData();
      fd.set('version', '2');
      fd.set('componentData', '{}');

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(409);
    });

    it('creates next version, updates activeVersion, binds files', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });
      prismaResourceVersionFindFirstMock.mockResolvedValueOnce({ version: 1 });
      prismaResourceVersionFindUniqueMock.mockResolvedValueOnce(null);

      storageSaveFileMock.mockResolvedValueOnce({
        fileName: 'albedo.png',
        contentType: 'image/png',
        size: 3,
        sha256: 'abc',
        storagePath: 'files/xx/albedo.png',
        absolutePath: '/tmp',
      });

      prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
        const tx = {
          resourceVersion: {
            create: jest.fn().mockResolvedValue({ id: 'v2' }),
          },
          fileAsset: {
            create: jest.fn().mockResolvedValue({ id: 'file1' }),
          },
          resourceBinding: {
            create: jest.fn().mockResolvedValue({ id: 'b1' }),
          },
          resource: {
            update: jest.fn().mockResolvedValue({ id: 'r1', activeVersion: 2 }),
          },
        };
        return fn(tx);
      });

      const fd = new FormData();
      fd.set('componentData', '{}');
      fd.set('albedoMap', new File([new Uint8Array([1, 2, 3])], 'albedo.png', { type: 'image/png' }));

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(201);
      expect(storageSaveFileMock).toHaveBeenCalled();
      expect(prismaTransactionMock).toHaveBeenCalled();
    });

    it('returns 400 on duplicate file slot fields', async () => {
      prismaResourceFindFirstMock.mockResolvedValueOnce({ id: 'r1', kind: 'standardMaterial' });
      prismaResourceVersionFindFirstMock.mockResolvedValueOnce({ version: 1 });
      prismaResourceVersionFindUniqueMock.mockResolvedValueOnce(null);

      prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
        const tx = {
          resourceVersion: {
            create: jest.fn().mockResolvedValue({ id: 'v2' }),
          },
          fileAsset: {
            create: jest.fn().mockResolvedValue({ id: 'file1' }),
          },
          resourceBinding: {
            create: jest.fn().mockResolvedValue({ id: 'b1' }),
          },
          resource: {
            update: jest.fn().mockResolvedValue({ id: 'r1', activeVersion: 2 }),
          },
        };
        return fn(tx);
      });

      storageSaveFileMock.mockResolvedValue({
        fileName: 'x.png',
        contentType: 'image/png',
        size: 1,
        sha256: 'abc',
        storagePath: 'files/x/x.png',
        absolutePath: '/tmp',
      });

      const fd = new FormData();
      fd.set('componentData', '{}');
      fd.append('albedoMap', new File([new Uint8Array([1])], 'x.png', { type: 'image/png' }));
      fd.append('albedoMap', new File([new Uint8Array([1])], 'y.png', { type: 'image/png' }));

      const res = await POST(makeFormDataRequest(fd), makeContext({ resourceId: 'r1' }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Duplicate file field');
    });
  });
});
