import * as THREE from 'three';
import { TextureCache } from './TextureCache';

// Mock THREE.TextureLoader
jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return {
    ...actual,
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn(),
    })),
  };
});

describe('TextureCache', () => {
  let cache: TextureCache;
  let mockLoader: any;
  let mockTexture: THREE.Texture;

  beforeEach(() => {
    cache = new TextureCache();
    mockTexture = new THREE.Texture();
    mockTexture.dispose = jest.fn();
    
    // Access the mocked loader
    mockLoader = (cache as any).loader;
  });

  describe('load', () => {
    it('should load and cache a new texture', async () => {
      const url = 'test.png';
      
      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        setTimeout(() => onLoad(mockTexture), 0);
      });

      const result = await cache.load(url);

      expect(result).toBe(mockTexture);
      expect(cache.get(url)).toBe(mockTexture);
      expect(mockLoader.load).toHaveBeenCalledWith(
        url,
        expect.any(Function),
        undefined,
        expect.any(Function)
      );
    });

    it('should return cached texture without reloading', async () => {
      const url = 'cached.png';
      
      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        setTimeout(() => onLoad(mockTexture), 0);
      });

      await cache.load(url);
      mockLoader.load.mockClear();

      const result = await cache.load(url);

      expect(result).toBe(mockTexture);
      expect(mockLoader.load).not.toHaveBeenCalled();
    });

    it('should return same promise for concurrent loads', async () => {
      const url = 'concurrent.png';
      
      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        setTimeout(() => onLoad(mockTexture), 10);
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
      
      mockLoader.load.mockImplementation((url: string, onLoad: any, onProgress: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(error), 0);
      });

      await expect(cache.load(url)).rejects.toThrow('Load failed');
      expect(cache.get(url)).toBeUndefined();
    });

    it('should clear pending load on error', async () => {
      const url = 'error-clear.png';
      
      mockLoader.load.mockImplementation((url: string, onLoad: any, onProgress: any, onError: (err: Error) => void) => {
        setTimeout(() => onError(new Error('Failed')), 0);
      });

      await expect(cache.load(url)).rejects.toThrow();
      
      // Should be able to retry after error
      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        setTimeout(() => onLoad(mockTexture), 0);
      });

      const result = await cache.load(url);
      expect(result).toBe(mockTexture);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent texture', () => {
      expect(cache.get('nonexistent.png')).toBeUndefined();
    });

    it('should return cached texture', async () => {
      const url = 'test.png';
      
      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        setTimeout(() => onLoad(mockTexture), 0);
      });

      await cache.load(url);
      expect(cache.get(url)).toBe(mockTexture);
    });
  });

  describe('clear', () => {
    it('should dispose all cached textures', async () => {
      const tex1 = new THREE.Texture();
      const tex2 = new THREE.Texture();
      tex1.dispose = jest.fn();
      tex2.dispose = jest.fn();

      mockLoader.load.mockImplementation((url: string, onLoad: (tex: THREE.Texture) => void) => {
        const texture = url === 'tex1.png' ? tex1 : tex2;
        setTimeout(() => onLoad(texture), 0);
      });

      await cache.load('tex1.png');
      await cache.load('tex2.png');

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
