import { createResourcePersistenceHandlers } from '../httpHandlers';
import type { ResourcePersistenceContext } from '../resourcePersistenceContext';

describe('createResourcePersistenceHandlers', () => {
  it('returns 400 when resolve key is missing', async () => {
    const ctx: ResourcePersistenceContext = {
      resourcePersistence: {} as never,
      blobStorage: {} as never,
      publicUrls: { fileUrlForFileId: () => 'https://x/f' },
      zipReader: {} as never,
    };

    const handlers = createResourcePersistenceHandlers(ctx);
    const res = await handlers.handleEngineResourcesResolveGet(new Request('https://h/?'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing key');
  });

  it('returns supported kinds', async () => {
    const ctx: ResourcePersistenceContext = {
      resourcePersistence: {} as never,
      blobStorage: {} as never,
      publicUrls: { fileUrlForFileId: () => 'x' },
      zipReader: {} as never,
    };

    const handlers = createResourcePersistenceHandlers(ctx);
    const res = await handlers.handleResourcesKindsGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });
});
