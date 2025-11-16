import * as THREE from 'three';
import { ShaderMaterialFactory } from './ShaderMaterialFactory';
import { ShaderMaterialComponent } from '../../../domain/ecs/components/ShaderMaterialComponent';
import { TextureCache } from './TextureCache';

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
    it('should create ShaderMaterial with basic uniforms', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          color: { value: new THREE.Color(0xff0000), type: 'color' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material).toBeInstanceOf(THREE.ShaderMaterial);
      expect(material.uniforms.color).toBeDefined();
      expect(material.uniforms.color.value).toEqual(new THREE.Color(0xff0000));
    });

    it('should inject time uniform if not present', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.uniforms.time).toBeDefined();
      expect(material.uniforms.time.value).toBe(0);
    });

    it('should preserve existing time uniform', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          time: { value: 5.0, type: 'float' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.uniforms.time.value).toBe(5.0);
    });

    it('should handle multiple uniform types', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          floatVal: { value: 3.14, type: 'float' },
          colorVal: { value: new THREE.Color(0x00ff00), type: 'color' },
          vec2Val: { value: new THREE.Vector2(1, 2), type: 'vec2' },
          vec3Val: { value: new THREE.Vector3(1, 2, 3), type: 'vec3' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.uniforms.floatVal.value).toBe(3.14);
      expect(material.uniforms.colorVal.value).toEqual(new THREE.Color(0x00ff00));
      expect(material.uniforms.vec2Val.value).toEqual(new THREE.Vector2(1, 2));
      expect(material.uniforms.vec3Val.value).toEqual(new THREE.Vector3(1, 2, 3));
    });

    it('should load texture uniforms asynchronously', async () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          diffuseMap: { value: 'path/to/texture.png', type: 'texture' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('path/to/texture.png');
      expect(material.uniforms.diffuseMap).toBeDefined();
      expect(material.uniforms.diffuseMap.value).toBeNull();

      // Wait for async texture load
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(material.uniforms.diffuseMap.value).toBe(mockTexture);
    });

    it('should handle multiple texture uniforms', async () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          tex1: { value: 'texture1.png', type: 'texture' },
          tex2: { value: 'texture2.png', type: 'texture' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(mockTextureCache.load).toHaveBeenCalledWith('texture1.png');
      expect(mockTextureCache.load).toHaveBeenCalledWith('texture2.png');

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(material.uniforms.tex1.value).toBe(mockTexture);
      expect(material.uniforms.tex2.value).toBe(mockTexture);
    });

    it('should use default vertex shader when not provided', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.vertexShader).toContain('uniform float time');
      expect(material.vertexShader).toContain('varying vec2 vUv');
      expect(material.vertexShader).toContain('gl_Position');
    });

    it('should use default fragment shader when not provided', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.fragmentShader).toContain('uniform float time');
      expect(material.fragmentShader).toContain('varying vec2 vUv');
      expect(material.fragmentShader).toContain('gl_FragColor');
    });

    it('should use custom vertex shader when provided', () => {
      const customVertex = 'void main() { gl_Position = vec4(0.0); }';
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
        vertexShader: customVertex,
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.vertexShader).toBe(customVertex);
    });

    it('should use custom fragment shader when provided', () => {
      const customFragment = 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }';
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
        fragmentShader: customFragment,
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.fragmentShader).toBe(customFragment);
    });

    it('should set transparent property', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
        transparent: true,
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.transparent).toBe(true);
    });

    it('should default transparent to true', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.transparent).toBe(true);
    });

    it('should set depthWrite property', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
        depthWrite: true,
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.depthWrite).toBe(true);
    });

    it('should use AdditiveBlending by default', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.blending).toBe(THREE.AdditiveBlending);
    });

    it('should use NormalBlending when specified', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
        blending: 'normal',
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.blending).toBe(THREE.NormalBlending);
    });

    it('should create material with empty uniforms object', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {},
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.uniforms).toBeDefined();
      expect(material.uniforms.time).toBeDefined(); // Only time should be added
    });

    it('should create material that can be used in mesh', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          color: { value: new THREE.Color(0xff0000), type: 'color' },
        },
      });

      const material = ShaderMaterialFactory.build(component, mockTextureCache);
      const geometry = new THREE.BoxGeometry();
      const mesh = new THREE.Mesh(geometry, material);

      expect(mesh.material).toBe(material);
      expect(mesh.material).toBeInstanceOf(THREE.ShaderMaterial);
    });

    it('should handle complex uniform setup', () => {
      const component = new ShaderMaterialComponent({
        shaderType: 'custom',
        uniforms: {
          time: { value: 10.0, type: 'float' },
          resolution: { value: new THREE.Vector2(1920, 1080), type: 'vec2' },
          diffuse: { value: 'diffuse.png', type: 'texture' },
          normalMap: { value: 'normal.png', type: 'texture' },
          lightPos: { value: new THREE.Vector3(0, 10, 0), type: 'vec3' },
          intensity: { value: 1.5, type: 'float' },
        },
        transparent: true,
        blending: 'additive',
      } as any);

      const material = ShaderMaterialFactory.build(component, mockTextureCache);

      expect(material.uniforms.time.value).toBe(10.0);
      expect(material.uniforms.resolution.value).toEqual(new THREE.Vector2(1920, 1080));
      expect(material.uniforms.lightPos.value).toEqual(new THREE.Vector3(0, 10, 0));
      expect(material.uniforms.intensity.value).toBe(1.5);
      expect(material.transparent).toBe(true);
      expect(material.blending).toBe(THREE.AdditiveBlending);
      expect(mockTextureCache.load).toHaveBeenCalledTimes(2);
    });
  });
});
