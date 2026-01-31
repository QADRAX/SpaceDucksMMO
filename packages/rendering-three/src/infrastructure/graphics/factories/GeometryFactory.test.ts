import { jest } from '@jest/globals';
import * as THREE from 'three';
import { GeometryFactory } from './GeometryFactory';

describe('GeometryFactory', () => {
  describe('build', () => {
    it('should create sphere geometry with default segments', () => {
      const geometry = GeometryFactory.build({
        type: 'sphere',
        radius: 5,
      });

      expect(geometry).toBeInstanceOf(THREE.SphereGeometry);
      // Default segments: widthSegments=32, heightSegments=16
    });

    it('should create sphere geometry with custom segments', () => {
      const geometry = GeometryFactory.build({
        type: 'sphere',
        radius: 3,
        widthSegments: 16,
        heightSegments: 8,
      });

      expect(geometry).toBeInstanceOf(THREE.SphereGeometry);
    });

    it('should create box geometry', () => {
      const geometry = GeometryFactory.build({
        type: 'box',
        width: 10,
        height: 5,
        depth: 2,
      });

      expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
    });

    it('should create plane geometry with default segments', () => {
      const geometry = GeometryFactory.build({
        type: 'plane',
        width: 100,
        height: 50,
      });

      expect(geometry).toBeInstanceOf(THREE.PlaneGeometry);
    });

    it('should create plane geometry with custom segments', () => {
      const geometry = GeometryFactory.build({
        type: 'plane',
        width: 100,
        height: 50,
        widthSegments: 10,
        heightSegments: 5,
      });

      expect(geometry).toBeInstanceOf(THREE.PlaneGeometry);
    });

    it('should create cylinder geometry with default segments', () => {
      const geometry = GeometryFactory.build({
        type: 'cylinder',
        radiusTop: 3,
        radiusBottom: 5,
        height: 10,
      });

      expect(geometry).toBeInstanceOf(THREE.CylinderGeometry);
    });

    it('should create cylinder geometry with custom segments', () => {
      const geometry = GeometryFactory.build({
        type: 'cylinder',
        radiusTop: 2,
        radiusBottom: 4,
        height: 8,
        radialSegments: 32,
      });

      expect(geometry).toBeInstanceOf(THREE.CylinderGeometry);
    });

    it('should create cone geometry with default segments', () => {
      const geometry = GeometryFactory.build({
        type: 'cone',
        radius: 5,
        height: 10,
      });

      expect(geometry).toBeInstanceOf(THREE.ConeGeometry);
    });

    it('should create cone geometry with custom segments', () => {
      const geometry = GeometryFactory.build({
        type: 'cone',
        radius: 3,
        height: 6,
        radialSegments: 8,
      });

      expect(geometry).toBeInstanceOf(THREE.ConeGeometry);
    });

    it('should create torus geometry with default segments', () => {
      const geometry = GeometryFactory.build({
        type: 'torus',
        radius: 10,
        tube: 3,
      });

      expect(geometry).toBeInstanceOf(THREE.TorusGeometry);
    });

    it('should create torus geometry with custom segments', () => {
      const geometry = GeometryFactory.build({
        type: 'torus',
        radius: 8,
        tube: 2,
        radialSegments: 12,
        tubularSegments: 24,
      });

      expect(geometry).toBeInstanceOf(THREE.TorusGeometry);
    });

    it('should return box geometry fallback for custom type', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const geometry = GeometryFactory.build({
        type: 'custom',
        key: 'myCustomShape',
      } as any);

      expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('custom geometry')
      );

      warnSpy.mockRestore();
    });

    it('should return box geometry fallback for unknown type', () => {
      const geometry = GeometryFactory.build({
        type: 'unknown',
      } as any);

      expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
    });

    it('should create valid buffer geometry that can be used in mesh', () => {
      const geometry = GeometryFactory.build({
        type: 'sphere',
        radius: 1,
      });

      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      expect(mesh.geometry).toBe(geometry);
      expect(geometry.attributes.position).toBeDefined();
    });

    it('should handle all geometry types without throwing', () => {
      const types = ['sphere', 'box', 'plane', 'cylinder', 'cone', 'torus'];

      types.forEach((type) => {
        expect(() => {
          const params = type === 'sphere' ? { type, radius: 1 } :
                        type === 'box' ? { type, width: 1, height: 1, depth: 1 } :
                        type === 'plane' ? { type, width: 1, height: 1 } :
                        type === 'cylinder' ? { type, radiusTop: 1, radiusBottom: 1, height: 1 } :
                        type === 'cone' ? { type, radius: 1, height: 1 } :
                        { type, radius: 1, tube: 0.4 };
          
          GeometryFactory.build(params as any);
        }).not.toThrow();
      });
    });
  });
});
