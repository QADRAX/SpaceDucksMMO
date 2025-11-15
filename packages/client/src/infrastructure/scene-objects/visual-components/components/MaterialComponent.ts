import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

/**
 * Configuration for material properties
 */
export interface MaterialComponentConfig {
  color?: number;
  roughness?: number;
  metalness?: number;
  receiveShadows?: boolean;
  castShadows?: boolean;
}

/**
 * Component that manages the base material of a 3D object.
 * Handles MeshStandardMaterial properties like color, roughness, and metalness.
 * 
 * Designed to work with THREE.MeshStandardMaterial for PBR rendering.
 * Can be extended to support other material types in the future.
 */
export class MaterialComponent implements IInspectableComponent {
  private config: Required<MaterialComponentConfig>;
  private parentMesh?: THREE.Mesh;
  private material?: THREE.MeshStandardMaterial;
  private originalMaterial?: THREE.Material; // Save original material

  constructor(config: MaterialComponentConfig) {
    this.config = {
      color: config.color ?? 0xffffff,
      roughness: config.roughness ?? 0.8,
      metalness: config.metalness ?? 0.1,
      receiveShadows: config.receiveShadows ?? true,
      castShadows: config.castShadows ?? true,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.parentMesh = parentMesh;
    
    // Save original material if not already saved
    if (!this.originalMaterial && parentMesh.material) {
      this.originalMaterial = parentMesh.material as THREE.Material;
    }
    
    // Create or replace material
    if (parentMesh.material instanceof THREE.MeshStandardMaterial) {
      // Update existing material
      this.material = parentMesh.material;
      this.applyMaterialProperties();
    } else {
      // Create new material
      this.material = new THREE.MeshStandardMaterial({
        color: this.config.color,
        roughness: this.config.roughness,
        metalness: this.config.metalness,
        flatShading: false,
      });
      
      // Replace parent material
      if (parentMesh.material) {
        (parentMesh.material as THREE.Material).dispose();
      }
      parentMesh.material = this.material;
    }

    // Apply shadow settings
    parentMesh.receiveShadow = this.config.receiveShadows;
    parentMesh.castShadow = this.config.castShadows;
  }

  update(deltaTime: number): void {
    // Material properties are static unless changed via setProperty
  }

  dispose(scene: THREE.Scene): void {
    // Restore original material
    if (this.parentMesh && this.originalMaterial) {
      this.parentMesh.material = this.originalMaterial;
    }
    
    // Dispose our material
    if (this.material) {
      this.material.dispose();
      this.material = undefined;
    }
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'material.color',
        label: 'Color',
        type: 'color',
        value: this.config.color,
      },
      {
        name: 'material.roughness',
        label: 'Roughness',
        type: 'number',
        value: this.config.roughness,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        name: 'material.metalness',
        label: 'Metalness',
        type: 'number',
        value: this.config.metalness,
        min: 0,
        max: 1,
        step: 0.05,
      },
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];

    if (propName === 'color') {
      this.config.color = value;
      if (this.material) {
        this.material.color.setHex(value);
      }
    } else if (propName === 'roughness') {
      this.config.roughness = value;
      if (this.material) {
        this.material.roughness = value;
      }
    } else if (propName === 'metalness') {
      this.config.metalness = value;
      if (this.material) {
        this.material.metalness = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];

    if (propName === 'color') return this.config.color;
    if (propName === 'roughness') return this.config.roughness;
    if (propName === 'metalness') return this.config.metalness;

    return undefined;
  }

  private applyMaterialProperties(): void {
    if (!this.material) return;

    this.material.color.setHex(this.config.color);
    this.material.roughness = this.config.roughness;
    this.material.metalness = this.config.metalness;
    this.material.needsUpdate = true;
  }
}
