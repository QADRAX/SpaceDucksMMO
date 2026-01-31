import * as THREE from 'three';
import { CameraFactory } from './CameraFactory';
import { CameraViewComponent } from '@duckengine/ecs';

describe('CameraFactory', () => {
  describe('build', () => {
    it('should create PerspectiveCamera with default values', () => {
      const cameraView = new CameraViewComponent({});
      
      const camera = CameraFactory.build(cameraView);

      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(camera.fov).toBe(60);
      expect(camera.aspect).toBe(1);
      expect(camera.near).toBeCloseTo(0.1, 5);
      expect(camera.far).toBe(1000);
    });

    it('should create PerspectiveCamera with custom fov', () => {
      const cameraView = new CameraViewComponent({ fov: 75 });
      
      const camera = CameraFactory.build(cameraView);

      expect(camera.fov).toBe(75);
      expect(camera.aspect).toBe(1);
    });

    it('should create PerspectiveCamera with custom aspect ratio', () => {
      const cameraView = new CameraViewComponent({ aspect: 4 / 3 });
      
      const camera = CameraFactory.build(cameraView);

      expect(camera.aspect).toBe(4 / 3);
    });

    it('should create PerspectiveCamera with custom near and far planes', () => {
      const cameraView = new CameraViewComponent({ near: 1, far: 5000 });
      
      const camera = CameraFactory.build(cameraView);

      expect(camera.near).toBe(1);
      expect(camera.far).toBe(5000);
    });

    it('should create PerspectiveCamera with all custom parameters', () => {
      const cameraView = new CameraViewComponent({
        fov: 45,
        aspect: 21 / 9,
        near: 0.5,
        far: 10000,
      });
      
      const camera = CameraFactory.build(cameraView);

      expect(camera.fov).toBe(45);
      expect(camera.aspect).toBeCloseTo(21 / 9, 5);
      expect(camera.near).toBe(0.5);
      expect(camera.far).toBe(10000);
    });

    it('should create camera with correct projection matrix', () => {
      const cameraView = new CameraViewComponent({ fov: 90, aspect: 1 });
      
      const camera = CameraFactory.build(cameraView);

      // Camera should have a valid projection matrix
      expect(camera.projectionMatrix).toBeDefined();
      expect(camera.projectionMatrix.elements.length).toBe(16);
    });

    it('should create independent camera instances', () => {
      const cameraView1 = new CameraViewComponent({});
      const cameraView2 = new CameraViewComponent({ fov: 90 });
      
      const camera1 = CameraFactory.build(cameraView1);
      const camera2 = CameraFactory.build(cameraView2);

      expect(camera1).not.toBe(camera2);
      expect(camera1.fov).toBe(60);
      expect(camera2.fov).toBe(90);
    });

    it('should create camera that can be used in scene', () => {
      const cameraView = new CameraViewComponent({});
      const camera = CameraFactory.build(cameraView);
      const scene = new THREE.Scene();

      expect(() => scene.add(camera)).not.toThrow();
      expect(scene.children).toContain(camera);
    });

    it('should preserve component values after creation', () => {
      const cameraView = new CameraViewComponent({});
      const originalFov = cameraView.fov;
      
      const camera = CameraFactory.build(cameraView);
      
      // Modifying camera shouldn't affect component
      camera.fov = 120;
      expect(cameraView.fov).toBe(originalFov);
    });
  });
});
