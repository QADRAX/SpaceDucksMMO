const prismaResourceFindUniqueMock = jest.fn();
const prismaResourceVersionFindUniqueMock = jest.fn();
const prismaResourceUpdateMock = jest.fn();

const updateResourceThumbnailFromVersionMock = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    resource: {
      findUnique: (...args: unknown[]) => prismaResourceFindUniqueMock(...args),
      update: (...args: unknown[]) => prismaResourceUpdateMock(...args),
    },
    resourceVersion: {
      findUnique: (...args: unknown[]) => prismaResourceVersionFindUniqueMock(...args),
    },
  },
}));

jest.mock('@/lib/resourceThumbnail', () => ({
  updateResourceThumbnailFromVersion: (...args: unknown[]) => updateResourceThumbnailFromVersionMock(...args),
}));

import { PUT } from '../route';
import { makeContext, makeJsonRequest } from '@/test-utils/route';

describe('PUT /api/admin/resources/{resourceId}/versions/{version}/active', () => {
  beforeEach(() => {
    prismaResourceFindUniqueMock.mockReset();
    prismaResourceVersionFindUniqueMock.mockReset();
    prismaResourceUpdateMock.mockReset();
    updateResourceThumbnailFromVersionMock.mockReset();
  });

  it('returns 400 on invalid version', async () => {
    const res = await PUT(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '0' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when resource not found', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce(null);

    const res = await PUT(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '1' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Resource not found' });
  });

  it('returns 404 when version not found', async () => {
    prismaResourceFindUniqueMock.mockResolvedValueOnce({ id: 'r1' });
    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce(null);

    const res = await PUT(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '2' }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Version not found' });
  });

  it('updates activeVersion and returns refreshed resource', async () => {
    prismaResourceFindUniqueMock
      .mockResolvedValueOnce({ id: 'r1' })
      .mockResolvedValueOnce({ id: 'r1', activeVersion: 2 });

    prismaResourceVersionFindUniqueMock.mockResolvedValueOnce({ id: 'v2' });
    prismaResourceUpdateMock.mockResolvedValueOnce({ id: 'r1', activeVersion: 2 });

    const res = await PUT(makeJsonRequest(null), makeContext({ resourceId: 'r1', version: '2' }));
    expect(res.status).toBe(200);

    expect(prismaResourceUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { activeVersion: 2 } })
    );

    const json = await res.json();
    expect(json.activeVersion).toBe(2);
  });
});
