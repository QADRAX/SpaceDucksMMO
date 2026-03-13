import * as THREE from 'three';
import { RenderObjectRegistry, RenderComponent } from './RenderObjectRegistry';
import type { RenderContext } from '../features/RenderContext';

jest.mock('../debug/DebugUtils', () => ({
  deferredDispose: jest.fn((obj) => obj?.dispose?.()),
  deferredDisposeObject: jest.fn((obj) => obj?.dispose?.())
}));

describe('RenderObjectRegistry', () => {
  let registry: RenderObjectRegistry;
  let mockScene: THREE.Scene;
  let mockObject3D: THREE.Object3D;
  let mockGeometry: THREE.BufferGeometry;
  let mockMaterial: THREE.Material;

  beforeEach(() => {
    registry = new RenderObjectRegistry();
    mockScene = new THREE.Scene();
    mockScene.remove = jest.fn();

    mockObject3D = new THREE.Mesh();

    mockGeometry = new THREE.BufferGeometry();
    mockGeometry.dispose = jest.fn();

    mockMaterial = new THREE.MeshBasicMaterial();
    mockMaterial.dispose = jest.fn();
  });

  describe('add', () => {
    it('should add a component to the registry', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
      };

      registry.add('entity1', component);

      expect(registry.has('entity1')).toBe(true);
      expect(registry.get('entity1')).toBe(component);
    });

    it('should replace existing component with same entityId', () => {
      const component1: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
      };
      const component2: RenderComponent = {
        entityId: 'entity1',
        object3D: new THREE.Mesh(),
      };

      registry.add('entity1', component1);
      registry.add('entity1', component2);

      expect(registry.get('entity1')).toBe(component2);
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent entity', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should return component for existing entity', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
      };

      registry.add('entity1', component);

      expect(registry.get('entity1')).toBe(component);
    });
  });

  describe('has', () => {
    it('should return false for non-existent entity', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('should return true for existing entity', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
      };

      registry.add('entity1', component);

      expect(registry.has('entity1')).toBe(true);
    });
  });

  describe('remove', () => {
    it('should do nothing for non-existent entity', () => {
      registry.remove('nonexistent', mockScene);

      expect(mockScene.remove).not.toHaveBeenCalled();
    });

    it('should remove object3D from scene', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
      };

      registry.add('entity1', component);
      registry.remove('entity1', mockScene);

      expect(mockScene.remove).toHaveBeenCalledWith(mockObject3D);
      expect(registry.has('entity1')).toBe(false);
    });

    it('should dispose geometry', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        geometry: mockGeometry,
      };

      registry.add('entity1', component);
      registry.remove('entity1', mockScene);

      expect(mockGeometry.dispose).toHaveBeenCalled();
    });

    it('should dispose single material', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        material: mockMaterial,
      };

      registry.add('entity1', component);
      registry.remove('entity1', mockScene);

      expect(mockMaterial.dispose).toHaveBeenCalled();
    });

    it('should dispose material array', () => {
      const mat1 = new THREE.MeshBasicMaterial();
      const mat2 = new THREE.MeshPhongMaterial();
      mat1.dispose = jest.fn();
      mat2.dispose = jest.fn();

      const component: RenderComponent = {
        entityId: 'entity1',
        material: [mat1, mat2] as any,
      };

      registry.add('entity1', component);
      registry.remove('entity1', mockScene);

      expect(mat1.dispose).toHaveBeenCalled();
      expect(mat2.dispose).toHaveBeenCalled();
    });

    it('should dispose all resources when all are present', () => {
      const component: RenderComponent = {
        entityId: 'entity1',
        object3D: mockObject3D,
        geometry: mockGeometry,
        material: mockMaterial,
      };

      registry.add('entity1', component);
      registry.remove('entity1', mockScene);

      expect(mockScene.remove).toHaveBeenCalledWith(mockObject3D);
      expect(mockGeometry.dispose).toHaveBeenCalled();
      expect(mockMaterial.dispose).toHaveBeenCalled();
      expect(registry.has('entity1')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return empty map initially', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all components', () => {
      const comp1: RenderComponent = { entityId: 'entity1' };
      const comp2: RenderComponent = { entityId: 'entity2' };

      registry.add('entity1', comp1);
      registry.add('entity2', comp2);

      const all = registry.getAll();
      expect(all.size).toBe(2);
      expect(all.get('entity1')).toBe(comp1);
      expect(all.get('entity2')).toBe(comp2);
    });

    it('should return reference to internal map', () => {
      const comp: RenderComponent = { entityId: 'entity1' };
      registry.add('entity1', comp);

      const all = registry.getAll();
      expect(all).toBe((registry as any).components);
    });
  });

  describe('clear', () => {
    it('should do nothing when registry is empty', () => {
      registry.clear(mockScene);

      expect(mockScene.remove).not.toHaveBeenCalled();
    });

    it('should remove all components', () => {
      const obj1 = new THREE.Mesh();
      const obj2 = new THREE.Mesh();
      const geom1 = new THREE.BufferGeometry();
      const geom2 = new THREE.BufferGeometry();
      geom1.dispose = jest.fn();
      geom2.dispose = jest.fn();

      registry.add('entity1', {
        entityId: 'entity1',
        object3D: obj1,
        geometry: geom1,
      });
      registry.add('entity2', {
        entityId: 'entity2',
        object3D: obj2,
        geometry: geom2,
      });

      registry.clear(mockScene);

      expect(mockScene.remove).toHaveBeenCalledWith(obj1);
      expect(mockScene.remove).toHaveBeenCalledWith(obj2);
      expect(geom1.dispose).toHaveBeenCalled();
      expect(geom2.dispose).toHaveBeenCalled();
      expect(registry.getAll().size).toBe(0);
    });
  });
});
