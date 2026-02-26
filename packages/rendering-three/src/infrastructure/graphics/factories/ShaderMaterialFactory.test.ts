// @ts-ignore
import * as THREE from 'three/webgpu';
import { ShaderMaterialFactory } from './ShaderMaterialFactory';
import { BasicShaderMaterialComponent } from '@duckengine/core';
import { TextureCache } from './TextureCache';

// Mock three/tsl
jest.mock('three/tsl', () => ({
  glslFn: jest.fn().mockReturnValue(() => ({})),
  uv: jest.fn().mockReturnValue({}),
  time: {},
  uniform: jest.fn().mockImplementation((val) => ({ value: val })),
  texture: jest.fn().mockImplementation((val) => ({ value: val })),
  color: jest.fn().mockReturnValue({}),
}));

// Mock TextureCache
jest.mock('./TextureCache');

describe('ShaderMaterialFactory', () => {
  let mockTextureCache: jest.Mocked<TextureCache>;
  let mockTexture: THREE.Texture;

  beforeEach(() => {
    mockTexture = new THREE.Texture();

    mockTextureCache = {
      load: jest.fn().mockResolvedValue(mockTexture),
      get: jest.fn(),
      clear: jest.fn(),
    } as any;
  });

  describe('build', () => {
    it('should create MeshBasicNodeMaterial with custom uniform nodes', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {
          color: { value: new THREE.Color(0xff0000), type: 'color' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.MeshBasicNodeMaterial);
      expect(material.userData.customUniformNodes.color).toBeDefined();
      expect(material.userData.customUniformNodes.color.value).toEqual(new THREE.Color(0xff0000));
    });

    it('should inject time uniform node if not present', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.userData.customUniformNodes.time).toBeDefined();
      expect(material.userData.customUniformNodes.time.value).toBe(0);
    });

    it('should handle multiple uniform nodes', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {
          floatVal: { value: 3.14, type: 'float' },
          colorVal: { value: new THREE.Color(0x00ff00), type: 'color' },
          vec2Val: { value: new THREE.Vector2(1, 2), type: 'vec2' },
          vec3Val: { value: new THREE.Vector3(1, 2, 3), type: 'vec3' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.userData.customUniformNodes.floatVal.value).toBe(3.14);
      expect(material.userData.customUniformNodes.colorVal.value).toEqual(new THREE.Color(0x00ff00));
      expect(material.userData.customUniformNodes.vec2Val.value).toEqual(new THREE.Vector2(1, 2));
      expect(material.userData.customUniformNodes.vec3Val.value).toEqual(new THREE.Vector3(1, 2, 3));
    });

    it('should create texture nodes and load them asynchronously', async () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {
          diffuseMap: { value: 'path/to/texture.png', type: 'texture' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('path/to/texture.png');
      expect(material.userData.customUniformNodes.diffuseMap).toBeDefined();
      expect(material.userData.customUniformNodes.diffuseMap.value).toBeNull();

      // Wait for async texture load
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(material.userData.customUniformNodes.diffuseMap.value).toBe(mockTexture);
    });

    it('should set transparent property', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
        transparent: true,
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.transparent).toBe(true);
    });

    it('should default transparent to true', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.transparent).toBe(true);
    });

    it('should set depthWrite property', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
        depthWrite: true,
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.depthWrite).toBe(true);
    });

    it('should use NormalBlending by default in refactor (or preserve legacy)', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.blending).toBe(THREE.NormalBlending);
    });

    it('should use AdditiveBlending when specified', () => {
      const component = new BasicShaderMaterialComponent({
        shaderId: 'test-shader',
        uniforms: {},
        blending: 'additive',
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.blending).toBe(THREE.AdditiveBlending);
    });
  });
});
