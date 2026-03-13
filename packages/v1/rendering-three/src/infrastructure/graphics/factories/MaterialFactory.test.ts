import * as THREE from 'three';
import { MaterialFactory } from './MaterialFactory';
import {
  StandardMaterialComponent,
  BasicMaterialComponent,
  PhongMaterialComponent,
  LambertMaterialComponent,
} from '@duckengine/core';
import { TextureCache } from './TextureCache';

// Mock TextureCache
jest.mock('./TextureCache');

describe('MaterialFactory', () => {
  let mockTextureCache: jest.Mocked<TextureCache>;
  let mockTexture: THREE.Texture;

  beforeEach(() => {
    // Use a lightweight mock texture object to avoid browser-specific
    // image/video globals (VideoFrame) when running in Node/Jest.
    mockTexture = {} as any;
    (mockTexture as any).clone = jest.fn().mockImplementation(() => mockTexture);

    mockTextureCache = {
      load: jest.fn().mockResolvedValue(mockTexture),
      get: jest.fn(),
      clear: jest.fn(),
    } as any;
  });

  describe('build', () => {
    it('should create MeshStandardMaterial for standard type', () => {
      const component = new StandardMaterialComponent({
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.3,
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
      const stdMat = material as THREE.MeshStandardMaterial;
      expect(stdMat.color.getHex()).toBe(0xff0000);
      expect(stdMat.metalness).toBe(0.5);
      expect(stdMat.roughness).toBe(0.3);
    });

    it('should create MeshBasicMaterial for basic type', () => {
      const component = new BasicMaterialComponent({
        color: '#00ff00',
        transparent: true,
        opacity: 0.7,
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
      const basicMat = material as THREE.MeshBasicMaterial;
      expect(basicMat.color.getHex()).toBe(0x00ff00);
      expect(basicMat.transparent).toBe(true);
      expect(basicMat.opacity).toBe(0.7);
    });

    it('should create MeshPhongMaterial for phong type', () => {
      const component = new PhongMaterialComponent({
        color: '#0000ff',
        specular: '#ffffff',
        shininess: 30,
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshPhongMaterial);
      const phongMat = material as THREE.MeshPhongMaterial;
      expect(phongMat.color.getHex()).toBe(0x0000ff);
      expect(phongMat.specular.getHex()).toBe(0xffffff);
      expect(phongMat.shininess).toBe(30);
    });

    it('should create MeshLambertMaterial for lambert type', () => {
      const component = new LambertMaterialComponent({
        color: '#ffff00',
        emissive: '#ff0000',
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshLambertMaterial);
      const lambertMat = material as THREE.MeshLambertMaterial;
      expect(lambertMat.color.getHex()).toBe(0xffff00);
      expect(lambertMat.emissive.getHex()).toBe(0xff0000);
    });

    it('should create default standard material for unknown type', () => {
      const component = new StandardMaterialComponent({} as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
      // StandardMaterialComponent without explicit color will produce
      // a MeshStandardMaterial with default white color (0xffffff)
      expect((material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xffffff);
    });

    it('should load and apply texture map asynchronously', async () => {
      const component = new BasicMaterialComponent({} as any);
      component.texture = 'path/to/texture.png';

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('path/to/texture.png');

      // Wait for async texture loading
      await new Promise(resolve => setTimeout(resolve, 0));

      expect((material as any).map).toBe(mockTexture);
    });

    it('should load and apply normal map asynchronously', async () => {
      const component = new StandardMaterialComponent({} as any);
      component.normalMap = 'path/to/normal.png';

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('path/to/normal.png');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect((material as any).normalMap).toBe(mockTexture);
    });

    it('should load and apply environment map asynchronously', async () => {
      const component = new StandardMaterialComponent({} as any);
      component.envMap = 'path/to/env.png';

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('path/to/env.png');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect((material as any).envMap).toBe(mockTexture);
    });

    it('should load multiple textures', async () => {
      const component = new StandardMaterialComponent({} as any);
      component.texture = 'diffuse.png';
      component.normalMap = 'normal.png';
      component.envMap = 'env.png';

      const material = MaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('diffuse.png');
      expect(mockTextureCache.load).toHaveBeenCalledWith('normal.png');
      expect(mockTextureCache.load).toHaveBeenCalledWith('env.png');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect((material as any).map).toBe(mockTexture);
      expect((material as any).normalMap).toBe(mockTexture);
      expect((material as any).envMap).toBe(mockTexture);
    });

    it('should not load textures if not specified', () => {
      const component = new BasicMaterialComponent({} as any);

      MaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).not.toHaveBeenCalled();
    });

    it('should handle all material types without throwing', () => {
      const components = [
        new StandardMaterialComponent({} as any),
        new BasicMaterialComponent({} as any),
        new PhongMaterialComponent({} as any),
        new LambertMaterialComponent({} as any),
      ];

      components.forEach((component) => {
        expect(() => {
          MaterialFactory.build(component as any, mockTextureCache);
        }).not.toThrow();
      });
    });

    it('should preserve wireframe setting for basic material', () => {
      const component = new BasicMaterialComponent({
        wireframe: true,
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      expect((material as THREE.MeshBasicMaterial).wireframe).toBe(true);
    });

    it('should handle emissive properties', () => {
      const component = new StandardMaterialComponent({
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
      } as any);

      const material = MaterialFactory.build(component, mockTextureCache);

      const stdMat = material as THREE.MeshStandardMaterial;
      expect(stdMat.emissive.getHex()).toBe(0xff0000);
      expect(stdMat.emissiveIntensity).toBe(0.5);
    });
  });
});
