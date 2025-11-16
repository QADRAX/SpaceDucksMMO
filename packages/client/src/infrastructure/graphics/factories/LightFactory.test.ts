import * as THREE from 'three';
import { LightFactory } from './LightFactory';
import { Entity } from '../../../domain/ecs/core/Entity';
import { LightComponent } from '../../../domain/ecs/components/LightComponent';

describe('LightFactory', () => {
  let scene: THREE.Scene;
  let entity: Entity;

  beforeEach(() => {
    scene = new THREE.Scene();
    entity = new Entity('test-light');
    entity.transform.setPosition(5, 10, 15);
  });

  describe('build', () => {
    it('should create AmbientLight with default values', () => {
      const lightComp = new LightComponent({ type: 'ambient' });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect(light).toBeInstanceOf(THREE.AmbientLight);
      expect((light as THREE.AmbientLight).color.getHex()).toBe(0xffffff);
      expect(light.intensity).toBe(0.5);
    });

    it('should create AmbientLight with custom color and intensity', () => {
      const lightComp = new LightComponent({
        type: 'ambient',
        color: '#ff0000',
        intensity: 0.8,
      });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect((light as THREE.AmbientLight).color.getHex()).toBe(0xff0000);
      expect(light.intensity).toBe(0.8);
    });

    it('should create DirectionalLight with position and target', () => {
      const lightComp = new LightComponent({ type: 'directional' });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect(light).toBeInstanceOf(THREE.DirectionalLight);
      expect(light.position.x).toBe(5);
      expect(light.position.y).toBe(10);
      expect(light.position.z).toBe(15);
      
      const dirLight = light as THREE.DirectionalLight;
      expect(dirLight.target).toBeDefined();
      expect(scene.children).toContain(dirLight.target);
    });

    it('should create DirectionalLight with custom color and intensity', () => {
      const lightComp = new LightComponent({
        type: 'directional',
        color: '#00ff00',
        intensity: 2.0,
      });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect((light as THREE.DirectionalLight).color.getHex()).toBe(0x00ff00);
      expect(light.intensity).toBe(2.0);
    });

    it('should create PointLight with position', () => {
      const lightComp = new LightComponent({ type: 'point' });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect(light).toBeInstanceOf(THREE.PointLight);
      expect(light.position.x).toBe(5);
      expect(light.position.y).toBe(10);
      expect(light.position.z).toBe(15);
    });

    it('should create PointLight with custom distance and decay', () => {
      const lightComp = new LightComponent({
        type: 'point',
        intensity: 1.5,
        distance: 50,
        decay: 2,
      } as any);
      
      const light = LightFactory.build(entity, lightComp, scene);

      const pointLight = light as THREE.PointLight;
      expect(pointLight.intensity).toBe(1.5);
      expect(pointLight.distance).toBe(50);
      expect(pointLight.decay).toBe(2);
    });

    it('should create SpotLight with position and target', () => {
      const lightComp = new LightComponent({ type: 'spot' });
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect(light).toBeInstanceOf(THREE.SpotLight);
      expect(light.position.x).toBe(5);
      expect(light.position.y).toBe(10);
      expect(light.position.z).toBe(15);
      
      const spotLight = light as THREE.SpotLight;
      expect(spotLight.target).toBeDefined();
      expect(scene.children).toContain(spotLight.target);
    });

    it('should create SpotLight with custom angle and penumbra', () => {
      const lightComp = new LightComponent({
        type: 'spot',
        intensity: 1.2,
        angle: Math.PI / 4,
        penumbra: 0.5,
        distance: 100,
        decay: 1.5,
      } as any);
      
      const light = LightFactory.build(entity, lightComp, scene);

      const spotLight = light as THREE.SpotLight;
      expect(spotLight.intensity).toBe(1.2);
      expect(spotLight.angle).toBe(Math.PI / 4);
      expect(spotLight.penumbra).toBe(0.5);
      expect(spotLight.distance).toBe(100);
      expect(spotLight.decay).toBe(1.5);
    });

    it('should create default AmbientLight for unknown type', () => {
      const lightComp = new LightComponent({ type: 'unknown' } as any);
      
      const light = LightFactory.build(entity, lightComp, scene);

      expect(light).toBeInstanceOf(THREE.AmbientLight);
      expect(light.intensity).toBe(0.3);
    });

    it('should position directional light target based on entity forward', () => {
      entity.transform.setRotation(0, Math.PI / 2, 0); // Rotate 90 degrees
      const lightComp = new LightComponent({ type: 'directional' });
      
      const light = LightFactory.build(entity, lightComp, scene);
      const dirLight = light as THREE.DirectionalLight;

      // Target should be positioned forward from the entity
      const distance = dirLight.target.position.distanceTo(entity.transform.worldPosition);
      expect(distance).toBeCloseTo(10, 0);
    });

    it('should position spot light target based on entity forward', () => {
      entity.transform.setRotation(Math.PI / 4, 0, 0);
      const lightComp = new LightComponent({ type: 'spot' });
      
      const light = LightFactory.build(entity, lightComp, scene);
      const spotLight = light as THREE.SpotLight;

      const distance = spotLight.target.position.distanceTo(entity.transform.worldPosition);
      expect(distance).toBeCloseTo(10, 0);
    });
  });

  describe('updateDirectionalTarget', () => {
    it('should update DirectionalLight target position', () => {
      const lightComp = new LightComponent({ type: 'directional' });
      const light = LightFactory.build(entity, lightComp, scene) as THREE.DirectionalLight;
      
      const initialTargetPos = light.target.position.clone();
      
      // Move entity
      entity.transform.setPosition(20, 30, 40);
      LightFactory.updateDirectionalTarget(light, entity);

      expect(light.target.position).not.toEqual(initialTargetPos);
      const distance = light.target.position.distanceTo(entity.transform.worldPosition);
      expect(distance).toBeCloseTo(10, 0);
    });

    it('should update SpotLight target position', () => {
      const lightComp = new LightComponent({ type: 'spot' });
      const light = LightFactory.build(entity, lightComp, scene) as THREE.SpotLight;
      
      const initialTargetPos = light.target.position.clone();
      
      // Rotate entity
      entity.transform.setRotation(0, Math.PI, 0);
      LightFactory.updateDirectionalTarget(light, entity);

      expect(light.target.position).not.toEqual(initialTargetPos);
    });

    it('should calculate target based on entity forward vector', () => {
      const lightComp = new LightComponent({ type: 'directional' });
      const light = LightFactory.build(entity, lightComp, scene) as THREE.DirectionalLight;
      
      // Set entity to look down
      entity.transform.setRotation(Math.PI / 2, 0, 0);
      LightFactory.updateDirectionalTarget(light, entity);

      const direction = new THREE.Vector3()
        .subVectors(light.target.position, entity.transform.worldPosition)
        .normalize();
      
      const forward = entity.transform.getForward();
      
      // Direction should align with forward
      expect(direction.dot(forward)).toBeCloseTo(1, 1);
    });

    it('should maintain fixed distance from entity', () => {
      const lightComp = new LightComponent({ type: 'spot' });
      const light = LightFactory.build(entity, lightComp, scene) as THREE.SpotLight;
      
      // Test multiple positions
      const positions = [
        [0, 0, 0],
        [100, 0, 0],
        [0, 50, 100],
      ] as Array<[number, number, number]>;

      positions.forEach(([x, y, z]) => {
        entity.transform.setPosition(x, y, z);
        LightFactory.updateDirectionalTarget(light, entity);
        
        const distance = light.target.position.distanceTo(entity.transform.worldPosition);
        expect(distance).toBeCloseTo(10, 0);
      });
    });
  });

  describe('integration', () => {
    it('should create all light types without throwing', () => {
      const types: Array<'ambient' | 'directional' | 'point' | 'spot'> = [
        'ambient',
        'directional',
        'point',
        'spot',
      ];

      types.forEach(type => {
        expect(() => {
          const lightComp = new LightComponent({ type });
          LightFactory.build(entity, lightComp, scene);
        }).not.toThrow();
      });
    });

    it('should add target objects only for directional and spot lights', () => {
      const initialChildCount = scene.children.length;

      LightFactory.build(entity, new LightComponent({ type: 'ambient' }), scene);
      expect(scene.children.length).toBe(initialChildCount);

      LightFactory.build(entity, new LightComponent({ type: 'point' }), scene);
      expect(scene.children.length).toBe(initialChildCount);

      LightFactory.build(entity, new LightComponent({ type: 'directional' }), scene);
      expect(scene.children.length).toBe(initialChildCount + 1);

      LightFactory.build(entity, new LightComponent({ type: 'spot' }), scene);
      expect(scene.children.length).toBe(initialChildCount + 2);
    });
  });
});
