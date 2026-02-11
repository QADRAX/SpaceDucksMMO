const prismaResourceFindManyMock = jest.fn();
const prismaTransactionMock = jest.fn();

const createResourceFromZipMock = jest.fn();
const updateResourceThumbnailFromVersionMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findMany: (...args: unknown[]) => prismaResourceFindManyMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

jest.mock('@/lib/resourceUpload/resourceZip', () => ({
  createResourceFromZip: (...args: unknown[]) => createResourceFromZipMock(...args),
}));

jest.mock('@/lib/resourceThumbnail', () => ({
  updateResourceThumbnailFromVersion: (...args: unknown[]) => updateResourceThumbnailFromVersionMock(...args),
}));

import { GET, POST } from '../route';
import { makeContext, makeFormDataRequest, makeJsonRequest } from '@/test-utils/route';

describe('admin resources', () => {
  beforeEach(() => {
    prismaResourceFindManyMock.mockReset();
    prismaTransactionMock.mockReset();
    createResourceFromZipMock.mockReset();
    updateResourceThumbnailFromVersionMock.mockReset();
  });

  describe('GET /api/admin/resources', () => {
    it('lists all resources when kind filter is missing', async () => {
      prismaResourceFindManyMock.mockResolvedValueOnce([{ id: 'r1' }, { id: 'r2' }]);

      const req = makeJsonRequest(null, { url: 'http://localhost/api/admin/resources' });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.count).toBe(2);
      expect(prismaResourceFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, orderBy: { updatedAt: 'desc' } })
      );
    });

    it('applies kind filter when kind is valid', async () => {
      prismaResourceFindManyMock.mockResolvedValueOnce([{ id: 'r1', kind: 'standardMaterial' }]);

      const req = makeJsonRequest(null, {
        url: 'http://localhost/api/admin/resources?kind=standardMaterial',
      });
      const res = await GET(req);
      expect(res.status).toBe(200);

      expect(prismaResourceFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: { kind: 'standardMaterial' } })
      );
    });

    it('ignores kind filter when kind is invalid', async () => {
      prismaResourceFindManyMock.mockResolvedValueOnce([]);

      const req = makeJsonRequest(null, {
        url: 'http://localhost/api/admin/resources?kind=not-a-kind',
      });
      const res = await GET(req);
      expect(res.status).toBe(200);

      expect(prismaResourceFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });

  describe('POST /api/admin/resources', () => {
    it('returns 400 when JSON payload is invalid', async () => {
      const res = await POST(makeJsonRequest({}));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid payload');
    });

    it('creates resource + version 1 from JSON', async () => {
      prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
        const tx = {
          resource: { create: jest.fn().mockResolvedValue({ id: 'r1', activeVersion: 1 }) },
          resourceVersion: { create: jest.fn().mockResolvedValue({ id: 'v1' }) },
        };
        return fn(tx);
      });

      const res = await POST(
        makeJsonRequest({ kind: 'standardMaterial', key: 'k1', displayName: 'My Res' })
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.id).toBe('r1');
      expect(prismaTransactionMock).toHaveBeenCalled();
    });

    it('creates resource from ZIP when multipart/form-data', async () => {
      const fd = new FormData();
      const zip = new File([new Uint8Array([1, 2, 3])], 'res.zip', { type: 'application/zip' });
      fd.set('zip', zip);

      createResourceFromZipMock.mockResolvedValueOnce({
        resource: { id: 'r1' },
        version: { version: 1 },
      });

      const res = await POST(makeFormDataRequest(fd, { url: 'http://localhost/api/admin/resources' }));
      expect(res.status).toBe(201);

      expect(createResourceFromZipMock).toHaveBeenCalled();
      expect(updateResourceThumbnailFromVersionMock).toHaveBeenCalledWith(
        expect.anything(),
        'r1',
        1
      );
    });

    it('returns 400 when ZIP is missing in multipart/form-data', async () => {
      const fd = new FormData();
      const res = await POST(makeFormDataRequest(fd));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json).toMatchObject({ error: 'Invalid payload' });
      expect(json.details).toBeDefined();
    });

    it('returns 400 when createResourceFromZip throws', async () => {
      const fd = new FormData();
      const zip = new File([new Uint8Array([1])], 'res.zip', { type: 'application/zip' });
      fd.set('zip', zip);

      createResourceFromZipMock.mockRejectedValueOnce(new Error('Bad zip'));

      const res = await POST(makeFormDataRequest(fd));
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'Bad zip' });
    });
  });
});
