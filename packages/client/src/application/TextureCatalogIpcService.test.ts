import TextureCatalogIpcService from './TextureCatalogIpcService';
import type { TextureCatalog } from './TextureCatalog';

describe('TextureCatalogIpcService', () => {
  const sample: TextureCatalog = {
    variants: [
      { id: 'planets/jupiter', quality: 'high', path: 'assets/textures/planets/8k/jupiter.jpg', label: 'planets/jupiter' },
      { id: 'planets/jupiter', quality: 'low', path: 'assets/textures/planets/2k/jupiter.jpg', label: 'planets/jupiter' },
      { id: 'planets/moon', quality: 'low', path: 'assets/textures/planets/2k/moon.jpg', label: 'planets/moon' }
    ]
  };

  test('getCatalog fetches once and caches', async () => {
    const calls: number[] = [];
    const fetcher = async () => { calls.push(1); return sample; };

    const svc = new TextureCatalogIpcService(fetcher);

    const c1 = await svc.getCatalog();
    const c2 = await svc.getCatalog();

    expect(c1).toBe(c2);
    expect(c1.variants.length).toBe(3);
    expect(calls.length).toBe(1);
  });

  test('getVariantsById returns filtered variants', async () => {
    const svc = new TextureCatalogIpcService(async () => sample);
    const v = await svc.getVariantsById('planets/jupiter');
    expect(v.length).toBe(2);
    expect(v.map(x => x.quality).sort()).toEqual(['high','low'].sort());
  });

  test('subscribe immediately calls and refresh notifies, unsubscribe stops', async () => {
    let current = sample;
    const fetcher = async () => current;
    const svc = new TextureCatalogIpcService(fetcher);

    // Ensure initial catalog is loaded so subscribe will invoke listener synchronously
    await svc.getCatalog();

    const calls: TextureCatalog[] = [];
    const unsub = svc.subscribe((c) => calls.push(c));

    // initial call was synchronous after cache present
    expect(calls.length).toBe(1);

    // change catalog and refresh
    current = {
      variants: [
        { id: 'planets/moon', quality: 'low', path: 'assets/textures/planets/2k/moon.jpg', label: 'planets/moon' }
      ]
    };

    await svc.refresh();
    expect(calls.length).toBe(2);

    unsub();
    current = sample;
    await svc.refresh();
    expect(calls.length).toBe(2); // still 2
  });
});
