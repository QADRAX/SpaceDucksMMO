import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

/**
 * Configuration for geometry
 */
export interface GeometryComponentConfig {
  type?: 'sphere' | 'box' | 'cylinder';
  radius?: number;
  segments?: number;
  width?: number;
  height?: number;
  depth?: number;
}

/**
 * Component that manages the base geometry of a 3D object.
 * Handles creation, updates, and disposal of THREE.js geometry.
 * 
 * Currently supports sphere geometry, but designed to be extensible
 * for other geometry types (box, cylinder, custom meshes, etc.)
 */
export class GeometryComponent implements IInspectableComponent {
  private config: Required<GeometryComponentConfig>;
  private parentMesh?: THREE.Mesh;
  private geometry?: THREE.BufferGeometry;
  private originalGeometry?: THREE.BufferGeometry; // Save original geometry

  constructor(config: GeometryComponentConfig) {
    this.config = {
      type: config.type ?? 'sphere',
      radius: config.radius ?? 1.0,
      segments: config.segments ?? 64,
      width: config.width ?? 1.0,
      height: config.height ?? 1.0,
      depth: config.depth ?? 1.0,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;
    
    // Save original geometry if not already saved
    if (!this.originalGeometry && parentMesh.geometry) {
      this.originalGeometry = parentMesh.geometry;
    }
    
    // Create initial geometry based on type
    this.geometry = this.createGeometry();
    
    // Replace parent mesh geometry (don't dispose original, we saved it)
    parentMesh.geometry = this.geometry;
  }

  update(deltaTime: number): void {
    // Geometry is static unless changed via setProperty
  }

  dispose(scene: THREE.Scene): void {
    // Restore original geometry
    if (this.parentMesh && this.originalGeometry) {
      this.parentMesh.geometry = this.originalGeometry;
    }
    
    // Dispose our geometry
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = undefined;
    }
  }

  getInspectableProperties(): InspectableProperty[] {
    const properties: InspectableProperty[] = [];

    if (this.config.type === 'sphere') {
      properties.push(
        {
          name: 'geometry.radius',
          label: 'Radius',
          type: 'number',
          value: this.config.radius,
          min: 0.1,
          max: 20,
          step: 0.1,
        },
        {
          name: 'geometry.segments',
          label: 'Segments',
          type: 'number',
          value: this.config.segments,
          min: 8,
          max: 128,
          step: 8,
        }
      );
    } else if (this.config.type === 'box') {
      properties.push(
        {
          name: 'geometry.width',
          label: 'Width',
          type: 'number',
          value: this.config.width,
          min: 0.1,
          max: 20,
          step: 0.1,
        },
        {
          name: 'geometry.height',
          label: 'Height',
          type: 'number',
          value: this.config.height,
          min: 0.1,
          max: 20,
          step: 0.1,
        },
        {
          name: 'geometry.depth',
          label: 'Depth',
          type: 'number',
          value: this.config.depth,
          min: 0.1,
          max: 20,
          step: 0.1,
        }
      );
    }

    return properties;
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];

    if (propName === 'radius') {
      this.config.radius = value;
      this.recreateGeometry();
    } else if (propName === 'segments') {
      this.config.segments = value;
      this.recreateGeometry();
    } else if (propName === 'width') {
      this.config.width = value;
      this.recreateGeometry();
    } else if (propName === 'height') {
      this.config.height = value;
      this.recreateGeometry();
    } else if (propName === 'depth') {
      this.config.depth = value;
      this.recreateGeometry();
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];

    if (propName === 'radius') return this.config.radius;
    if (propName === 'segments') return this.config.segments;
    if (propName === 'width') return this.config.width;
    if (propName === 'height') return this.config.height;
    if (propName === 'depth') return this.config.depth;

    return undefined;
  }

  /**
   * Get the current radius (useful for other components that need to know the size)
   */
  getRadius(): number {
    return this.config.radius;
  }

  private createGeometry(): THREE.BufferGeometry {
    switch (this.config.type) {
      case 'sphere':
        return new THREE.SphereGeometry(
          this.config.radius,
          this.config.segments,
          this.config.segments
        );
      case 'box':
        return new THREE.BoxGeometry(
          this.config.width,
          this.config.height,
          this.config.depth
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          this.config.radius,
          this.config.radius,
          this.config.height,
          this.config.segments
        );
      default:
        return new THREE.SphereGeometry(this.config.radius, this.config.segments, this.config.segments);
    }
  }

  private recreateGeometry(): void {
    if (!this.parentMesh) return;

    // Dispose old geometry
    if (this.geometry) {
      this.geometry.dispose();
    }

    // Create new geometry
    this.geometry = this.createGeometry();
    this.parentMesh.geometry = this.geometry;
  }
}
