import * as THREE from 'three';
import { TextureCache } from './TextureCache';

jest.mock('../debug/DebugUtils', () => ({
  deferredDispose: jest.fn((obj) => obj?.dispose?.())
}));

// Mock THREE.TextureLoader to have control over loading behaviorgeBitmapLoader.
// We mock the entire three/webgpu module (via the jest.config.js mapper) which
// re-exports three, so mocking 'three' here is sufficient.
jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    ImageBitmapLoader: jest.fn().mockImplementation(() => ({
      setOptions: jest.fn(),
      load: jest.fn(),
    })),
    // Keep Texture as-is so internal new THREE.Texture(bitmap) works
  };
});

describe('TextureCache', () => {
  let cache: TextureCache;
  let mockLoader: any;
  let mockBitmap: ImageBitmap;
  let mockTexture: THREE.Texture;

  beforeEach(() => {
    // Reset the mock before each test
    (THREE.ImageBitmapLoader as any).mockClear?.();
    cache = new TextureCache();
    mockLoader = (cache as any).loader;

    // ImageBitmapLoader produces an ImageBitmap, not a Texture.
    // The TextureCache wraps it in new THREE.Texture(bitmap) internally.
    mockBitmap = {} as ImageBitmap;
    // Create a lightweight mock texture for inspect
    mockTexture = new THREE.Texture(mockBitmap as any);
    mockTexture.dispose = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load and cache a new texture', async () => {
      const url = 'test.png';

      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 0);
      });

      const result = await cache.load(url);

      // Result is a THREE.Texture wrapping the bitmap
      expect(result).toBeInstanceOf(THREE.Texture);
      expect(cache.get(url)).toBe(result);
      expect(mockLoader.load).toHaveBeenCalledWith(
        url,
        expect.any(Function),
        undefined,
        expect.any(Function)
      );
    });

    it('should return cached texture without reloading', async () => {
      const url = 'cached.png';

      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 0);
      });

      await cache.load(url);
      mockLoader.load.mockClear();

      const result = await cache.load(url);

      expect(result).toBeInstanceOf(THREE.Texture);
      expect(mockLoader.load).not.toHaveBeenCalled();
    });

    it('should return same promise for concurrent loads', async () => {
      const url = 'concurrent.png';

      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 10);
      });

      const promise1 = cache.load(url);
      const promise2 = cache.load(url);

      expect(promise1).toBe(promise2);
      expect(mockLoader.load).toHaveBeenCalledTimes(1);

      await Promise.all([promise1, promise2]);
    });

    it('should handle load errors', async () => {
      const url = 'error.png';
      const error = new Error('Load failed');

      mockLoader.load.mockImplementation((url: string, onLoad: any, onProgress: any, onError: (err: any) => void) => {
        setTimeout(() => onError(error), 0);
      });

      await expect(cache.load(url)).rejects.toThrow();
      expect(cache.get(url)).toBeUndefined();
    });

    it('should clear pending load on error', async () => {
      const url = 'error-clear.png';

      mockLoader.load.mockImplementation((url: string, onLoad: any, onProgress: any, onError: (err: any) => void) => {
        setTimeout(() => onError(new Error('Failed')), 0);
      });

      await expect(cache.load(url)).rejects.toThrow();

      // Should be able to retry after error
      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 0);
      });

      const result = await cache.load(url);
      expect(result).toBeInstanceOf(THREE.Texture);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent texture', () => {
      expect(cache.get('nonexistent.png')).toBeUndefined();
    });

    it('should return cached texture', async () => {
      const url = 'test.png';

      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 0);
      });

      await cache.load(url);
      expect(cache.get(url)).toBeInstanceOf(THREE.Texture);
    });
  });

  describe('clear', () => {
    it('should dispose all cached textures', async () => {
      let loadCount = 0;
      mockLoader.load.mockImplementation((url: string, onLoad: (bitmap: ImageBitmap) => void) => {
        setTimeout(() => onLoad(mockBitmap), 0);
      });

      await cache.load('tex1.png');
      await cache.load('tex2.png');

      const tex1 = cache.get('tex1.png')!;
      const tex2 = cache.get('tex2.png')!;
      tex1.dispose = jest.fn();
      tex2.dispose = jest.fn();

      cache.clear();

      expect(tex1.dispose).toHaveBeenCalled();
      expect(tex2.dispose).toHaveBeenCalled();
      expect(cache.get('tex1.png')).toBeUndefined();
      expect(cache.get('tex2.png')).toBeUndefined();
    });

    it('should clear pending loads', () => {
      mockLoader.load.mockImplementation(() => {
        // Never resolves
      });

      cache.load('pending.png');
      cache.clear();

      // pendingLoads map should be cleared
      expect((cache as any).pendingLoads.size).toBe(0);
    });
  });
});
