import * as THREE from 'three';
import { ShaderUniformUpdater } from './ShaderUniformUpdater';
import { Entity, BasicShaderMaterialComponent, SphereGeometryComponent } from '@duckengine/ecs';
import type { RenderComponent } from './RenderObjectRegistry';

describe('ShaderUniformUpdater', () => {
  let updater: ShaderUniformUpdater;
  let entity: Entity;
  let shaderMatComp: BasicShaderMaterialComponent;
  let renderComponent: RenderComponent;
  let mockMesh: THREE.Mesh;
  let mockMaterial: THREE.Material;
  let mockUniformNodes: Record<string, any>;

  beforeEach(() => {
    updater = new ShaderUniformUpdater();
    entity = new Entity('test-entity');

    // Add required geometry component for ShaderMaterialComponent
    const geomComp = new SphereGeometryComponent({
      radius: 1,
    });
    entity.addComponent(geomComp as any);

    // Create shader material component
    shaderMatComp = new BasicShaderMaterialComponent({
      shaderId: 'custom',
      uniforms: {},
    });
    entity.addComponent(shaderMatComp);

    // Create mock mesh with shader material and custom nodes
    mockUniformNodes = {
      time: { value: 0.0 },
      color: { value: new THREE.Color(0xff0000) },
    };

    mockMaterial = new THREE.Material();
    mockMaterial.userData.customUniformNodes = mockUniformNodes;

    // @ts-ignore
    mockMesh = new THREE.Mesh(new THREE.BufferGeometry(), mockMaterial);

    renderComponent = {
      entityId: entity.id,
      object3D: mockMesh,
    };
  });

  describe('update', () => {
    it('should do nothing if entity has no shader material component', () => {
      entity.removeComponent('basicShaderMaterial');

      const initialTime = mockUniformNodes.time.value;
      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.time.value).toBe(initialTime);
    });

    it('should do nothing if object3D is not a Mesh', () => {
      renderComponent.object3D = new THREE.Object3D();

      const initialTime = mockUniformNodes.time.value;
      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.time.value).toBe(initialTime);
    });

    it('should do nothing if material has no customUniformNodes', () => {
      const materialWithoutNodes = new THREE.Material();
      mockMesh.material = materialWithoutNodes;

      // Should not throw
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
    });

    it('should increment time uniform', () => {
      const dt = 0.016;
      const initialTime = mockUniformNodes.time.value;

      updater.update(dt, entity, renderComponent);

      expect(mockUniformNodes.time.value).toBe(initialTime + dt);
    });

    it('should accumulate time over multiple updates', () => {
      updater.update(0.016, entity, renderComponent);
      updater.update(0.016, entity, renderComponent);
      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.time.value).toBeCloseTo(0.048, 5);
    });

    it('should sync component uniforms to material uniform nodes', () => {
      shaderMatComp.uniforms.color = { value: new THREE.Color(0x00ff00), type: 'color' };

      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.color.value).toEqual(new THREE.Color(0x00ff00));
    });

    it('should only sync uniforms that exist in material nodes', () => {
      shaderMatComp.uniforms.nonExistent = { value: 123, type: 'float' };

      // Should not throw or create new uniforms
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
      expect(mockUniformNodes.nonExistent).toBeUndefined();
    });

    it('should sync multiple uniforms', () => {
      shaderMatComp.uniforms.color = { value: new THREE.Color(0x0000ff), type: 'color' };
      mockUniformNodes.scale = { value: 1.0 };
      shaderMatComp.uniforms.scale = { value: 2.5, type: 'float' };

      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.color.value).toEqual(new THREE.Color(0x0000ff));
      expect(mockUniformNodes.scale.value).toBe(2.5);
    });

    it('should handle different uniform value types', () => {
      mockUniformNodes.floatVal = { value: 0.0 };
      mockUniformNodes.vec2Val = { value: new THREE.Vector2() };
      mockUniformNodes.vec3Val = { value: new THREE.Vector3() };

      shaderMatComp.uniforms.floatVal = { value: 3.14, type: 'float' };
      shaderMatComp.uniforms.vec2Val = { value: new THREE.Vector2(1, 2), type: 'vec2' };
      shaderMatComp.uniforms.vec3Val = { value: new THREE.Vector3(1, 2, 3), type: 'vec3' };

      updater.update(0.016, entity, renderComponent);

      expect(mockUniformNodes.floatVal.value).toBe(3.14);
      expect(mockUniformNodes.vec2Val.value).toEqual(new THREE.Vector2(1, 2));
      expect(mockUniformNodes.vec3Val.value).toEqual(new THREE.Vector3(1, 2, 3));
    });

    it('should update time and uniforms in same call', () => {
      const dt = 0.016;
      const initialTime = mockUniformNodes.time.value;
      shaderMatComp.uniforms.color = { value: new THREE.Color(0xffff00), type: 'color' };

      updater.update(dt, entity, renderComponent);

      expect(mockUniformNodes.time.value).toBe(initialTime + dt);
      expect(mockUniformNodes.color.value).toEqual(new THREE.Color(0xffff00));
    });

    it('should handle missing time uniform gracefully', () => {
      delete mockUniformNodes.time;

      shaderMatComp.uniforms.color = { value: new THREE.Color(0xff00ff), type: 'color' };

      // Should not throw and should still sync other uniforms
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
      expect(mockUniformNodes.color.value).toEqual(new THREE.Color(0xff00ff));
    });
  });
});
