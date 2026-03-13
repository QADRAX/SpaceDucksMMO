const prismaResourceFindUniqueMock = jest.fn();
const prismaResourceVersionCountMock = jest.fn();
const prismaResourceVersionFindUniqueMock = jest.fn();
const prismaTransactionMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findUnique: (...args: unknown[]) => prismaResourceFindUniqueMock(...args),
    },
    resourceVersion: {
      count: (...args: unknown[]) => prismaResourceVersionCountMock(...args),
      findUnique: (...args: unknown[]) => prismaResourceVersionFindUniqueMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

jest.mock('@/lib/storage', () => ({
  StorageService: {
    deleteFile: jest.fn(),
  },
}));

import { DELETE } from '../route';
import { makeContext, makeJsonRequest } from '@/test-utils/route';

describe('DELETE /api/admin/resources/{resourceId}/versions/{version}', () => {
  beforeEach(() => {
    prismaResourceFindUniqueMock.mockReset();
    prismaResourceVersionCountMock.mockReset();
    prismaResourceVersionFindUniqueMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it('returns 400 when deleting the only version', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce({ id: 'r1', activeVersion: 1 });
    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({ id: 'v1' });
    prismaResourceVersionCountMock.mockResolvedValueOnce(1);

    const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '1' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot delete the only version of a resource' });
  });

  it('returns 400 when deleting the active version (even if multiple versions exist)', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce({ id: 'r1', activeVersion: 2 });
    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({ id: 'v2' });
    prismaResourceVersionCountMock.mockResolvedValueOnce(2);

    const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '2' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Cannot delete the active version of a resource' });
  });

  it('returns 404 when version not found', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce({ id: 'r1', activeVersion: 2 });
    prismaResourceVersionCountMock.mockResolvedValueOnce(3);
    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce(null);

    const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '1' }));
    expect(res.status).toBe(404);
  });

  it('deletes when not active and not the only version', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce({ id: 'r1', activeVersion: 2 });
    prismaResourceVersionCountMock.mockResolvedValueOnce(3);
    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({ id: 'v1' });

    prismaTransactionMock.mockImplementationOnce(async (fn: any) => {
      const findMany = jest.fn().mockResolvedValue([]);
      return fn({
        fileAsset: {
          findMany,
          delete: jest.fn(),
        },
        resourceVersion: {
          delete: jest.fn().mockResolvedValue({ id: 'v1' }),
        },
      });
    });

    const res = await DELETE(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '1' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: 'v1' });
    expect(prismaTransactionMock).toHaveBeenCalled();
  });
});
