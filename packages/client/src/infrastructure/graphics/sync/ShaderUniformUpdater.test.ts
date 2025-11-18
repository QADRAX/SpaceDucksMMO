import * as THREE from 'three';
import { ShaderUniformUpdater } from './ShaderUniformUpdater';
import { Entity } from '../../../domain/ecs/core/Entity';
import { ShaderMaterialComponent } from '../../../domain/ecs/components/ShaderMaterialComponent';
import { SphereGeometryComponent } from '../../../domain/ecs/components/SphereGeometryComponent';
import type { RenderComponent } from './RenderObjectRegistry';

describe('ShaderUniformUpdater', () => {
  let updater: ShaderUniformUpdater;
  let entity: Entity;
  let shaderMatComp: ShaderMaterialComponent;
  let renderComponent: RenderComponent;
  let mockMesh: THREE.Mesh;
  let mockMaterial: THREE.ShaderMaterial;

  beforeEach(() => {
    updater = new ShaderUniformUpdater();
    entity = new Entity('test-entity');

    // Add required geometry component for ShaderMaterialComponent
    const geomComp = new SphereGeometryComponent({
      radius: 1,
    });
    entity.addComponent(geomComp as any);

    // Create shader material component
    shaderMatComp = new ShaderMaterialComponent({
      shaderType: 'custom',
      uniforms: {},
    });
    entity.addComponent(shaderMatComp);

    // Create mock mesh with shader material
    mockMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0xff0000) },
      },
    });
    mockMesh = new THREE.Mesh(new THREE.BufferGeometry(), mockMaterial);

    renderComponent = {
      entityId: entity.id,
      object3D: mockMesh,
    };
  });

  describe('update', () => {
    it('should do nothing if entity has no shader material component', () => {
      entity.removeComponent('shaderMaterial');

      const initialTime = mockMaterial.uniforms.time.value;
      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.time.value).toBe(initialTime);
    });

    it('should do nothing if object3D is not a Mesh', () => {
      renderComponent.object3D = new THREE.Object3D();

      const initialTime = mockMaterial.uniforms.time.value;
      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.time.value).toBe(initialTime);
    });

    it('should do nothing if material has no uniforms', () => {
      const materialWithoutUniforms = new THREE.ShaderMaterial();
      delete (materialWithoutUniforms as any).uniforms;
      mockMesh.material = materialWithoutUniforms;

      // Should not throw
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
    });

    it('should increment time uniform', () => {
      const dt = 0.016;
      const initialTime = mockMaterial.uniforms.time.value;

      updater.update(dt, entity, renderComponent);

      expect(mockMaterial.uniforms.time.value).toBe(initialTime + dt);
    });

    it('should accumulate time over multiple updates', () => {
      updater.update(0.016, entity, renderComponent);
      updater.update(0.016, entity, renderComponent);
      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.time.value).toBeCloseTo(0.048, 5);
    });

    it('should sync component uniforms to material uniforms', () => {
      shaderMatComp.uniforms.color = { value: new THREE.Color(0x00ff00), type: 'color' };

      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.color.value).toEqual(new THREE.Color(0x00ff00));
    });

    it('should only sync uniforms that exist in material', () => {
      shaderMatComp.uniforms.nonExistent = { value: 123, type: 'float' };

      // Should not throw or create new uniforms
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
      expect(mockMaterial.uniforms.nonExistent).toBeUndefined();
    });

    it('should sync multiple uniforms', () => {
      shaderMatComp.uniforms.color = { value: new THREE.Color(0x0000ff), type: 'color' };
      mockMaterial.uniforms.scale = { value: 1.0 };
      shaderMatComp.uniforms.scale = { value: 2.5, type: 'float' };

      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.color.value).toEqual(new THREE.Color(0x0000ff));
      expect(mockMaterial.uniforms.scale.value).toBe(2.5);
    });

    it('should handle different uniform value types', () => {
      mockMaterial.uniforms.floatVal = { value: 0.0 };
      mockMaterial.uniforms.vec2Val = { value: new THREE.Vector2() };
      mockMaterial.uniforms.vec3Val = { value: new THREE.Vector3() };

      shaderMatComp.uniforms.floatVal = { value: 3.14, type: 'float' };
      shaderMatComp.uniforms.vec2Val = { value: new THREE.Vector2(1, 2), type: 'vec2' };
      shaderMatComp.uniforms.vec3Val = { value: new THREE.Vector3(1, 2, 3), type: 'vec3' };

      updater.update(0.016, entity, renderComponent);

      expect(mockMaterial.uniforms.floatVal.value).toBe(3.14);
      expect(mockMaterial.uniforms.vec2Val.value).toEqual(new THREE.Vector2(1, 2));
      expect(mockMaterial.uniforms.vec3Val.value).toEqual(new THREE.Vector3(1, 2, 3));
    });

    it('should update time and uniforms in same call', () => {
      const dt = 0.016;
      const initialTime = mockMaterial.uniforms.time.value;
      shaderMatComp.uniforms.color = { value: new THREE.Color(0xffff00), type: 'color' };

      updater.update(dt, entity, renderComponent);

      expect(mockMaterial.uniforms.time.value).toBe(initialTime + dt);
      expect(mockMaterial.uniforms.color.value).toEqual(new THREE.Color(0xffff00));
    });

    it('should handle missing time uniform gracefully', () => {
      delete mockMaterial.uniforms.time;

      shaderMatComp.uniforms.color = { value: new THREE.Color(0xff00ff), type: 'color' };

      // Should not throw and should still sync other uniforms
      expect(() => updater.update(0.016, entity, renderComponent)).not.toThrow();
      expect(mockMaterial.uniforms.color.value).toEqual(new THREE.Color(0xff00ff));
    });
  });
});
