import { createPublicUrlResolver } from '../application/ports/publicUrl';
import { resolveResource } from '../application/useCases/resolveResource';

describe('resolveResource', () => {
  it('maps file slots to absolute URLs from PublicUrlResolver', async () => {
    const store = {
      findResourceSummaryByKey: jest.fn().mockResolvedValue({
        id: 'res-1',
        key: 'k',
        activeVersion: 1,
      }),
      findResourceVersionWithBindings: jest.fn().mockResolvedValue({
        id: 'v1',
        resourceId: 'res-1',
        version: 1,
        componentType: 'standardMaterial',
        componentData: '{"color":16777215}',
        bindings: [
          {
            slot: 'albedo',
            file: {
              id: 'f1',
              fileName: 'a.png',
              contentType: 'image/png',
              size: 10,
              sha256: 'abc',
              storagePath: 'p',
            },
          },
        ],
      }),
      findLatestResourceVersion: jest.fn(),
    };

    const publicUrls = createPublicUrlResolver({
      baseUrl: 'https://example.com',
      filesPath: '/api/files/:fileId',
    });

    const out = await resolveResource(store as never, publicUrls, { key: 'k', version: 'active' });

    expect(out).not.toBeNull();
    expect(out!.files.albedo?.url).toBe('https://example.com/api/files/f1');
    expect(out!.componentData).toEqual({ color: 16777215 });
  });

  it('returns null when resource is missing', async () => {
    const store = {
      findResourceSummaryByKey: jest.fn().mockResolvedValue(null),
      findResourceVersionWithBindings: jest.fn(),
      findLatestResourceVersion: jest.fn(),
    };

    const publicUrls = createPublicUrlResolver({ baseUrl: 'https://x.com' });
    const out = await resolveResource(store as never, publicUrls, { key: 'missing' });
    expect(out).toBeNull();
  });
});
