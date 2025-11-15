import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { GeometryComponent } from './GeometryComponent';
import * as THREE from 'three';

/**
 * Configuration for atmospheric glow effect
 */
export interface AtmosphereComponentConfig {
  color: number;
  thickness: number;
  intensity: number;
}

/**
 * Component that adds an atmospheric glow layer using Fresnel shader.
 */
export class AtmosphereComponent implements IInspectableComponent {
  private config: AtmosphereComponentConfig;
  private atmosphereMesh?: THREE.Mesh;
  private parentMesh?: THREE.Mesh;
  private parentRadius: number = 1.0;
  private scene?: THREE.Scene;
  private disposed: boolean = false;

  constructor(config: AtmosphereComponentConfig) {
    this.config = config;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.scene = scene;
    this.parentMesh = parentMesh;
    // Calculate parent radius from geometry
    const geometry = parentMesh.geometry as THREE.SphereGeometry;
    const bbox = new THREE.Box3().setFromObject(parentMesh);
    this.parentRadius = (bbox.max.x - bbox.min.x) / 2;

    // Subscribe to geometry changes if available
    if (visualBody && visualBody.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }

    this.createAtmosphere(scene);
  }

  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return; // Don't recreate if disposed
    
    this.parentRadius = newRadius;
    if (this.scene && this.parentMesh) {
      this.dispose(this.scene);
      this.createAtmosphere(this.scene);
    }
  };

  private createAtmosphere(scene: THREE.Scene): void {
    const atmosphereGeometry = new THREE.SphereGeometry(
      this.parentRadius * this.config.thickness,
      64,
      64
    );

    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(this.config.color) },
        intensity: { value: this.config.intensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
          
          gl_FragColor = vec4(glowColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    if (this.parentMesh) {
      this.atmosphereMesh.position.copy(this.parentMesh.position);
    }
    scene.add(this.atmosphereMesh);
  }

  update(deltaTime: number): void {
    if (!this.atmosphereMesh) return;

    // Keep atmosphere synchronized with parent position
    if (this.parentMesh) {
      this.atmosphereMesh.position.copy(this.parentMesh.position);
    }

    // Atmosphere can slowly rotate if needed
    this.atmosphereMesh.rotation.y += 0.00003 * deltaTime;
  }

  dispose(scene: THREE.Scene): void {
    this.disposed = true; // Mark as disposed to prevent recreation
    
    if (this.atmosphereMesh) {
      scene.remove(this.atmosphereMesh);
      this.atmosphereMesh.geometry.dispose();
      (this.atmosphereMesh.material as THREE.Material).dispose();
    }
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'atmosphere.color',
        label: 'Atmosphere Color',
        type: 'color',
        value: this.config.color,
        description: 'Color of atmospheric glow'
      },
      {
        name: 'atmosphere.thickness',
        label: 'Atmosphere Thickness',
        type: 'number',
        value: this.config.thickness,
        min: 1.0,
        max: 2.0,
        step: 0.05,
        description: 'Size multiplier for atmosphere layer'
      },
      {
        name: 'atmosphere.intensity',
        label: 'Atmosphere Intensity',
        type: 'number',
        value: this.config.intensity,
        min: 0,
        max: 2,
        step: 0.1,
        description: 'Brightness of atmospheric glow'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'color') {
      this.config.color = value;
      if (this.atmosphereMesh) {
        const material = this.atmosphereMesh.material as THREE.ShaderMaterial;
        material.uniforms.glowColor.value = new THREE.Color(value);
      }
    } else if (propName === 'thickness') {
      this.config.thickness = value;
      // Recreate atmosphere mesh with new size
      if (this.atmosphereMesh && this.parentMesh && this.scene) {
        this.dispose(this.scene);
        this.createAtmosphere(this.scene);
      }
    } else if (propName === 'intensity') {
      this.config.intensity = value;
      if (this.atmosphereMesh) {
        const material = this.atmosphereMesh.material as THREE.ShaderMaterial;
        material.uniforms.intensity.value = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.color;
    if (propName === 'thickness') return this.config.thickness;
    if (propName === 'intensity') return this.config.intensity;
    
    return undefined;
  }

  /**
   * Update atmosphere intensity at runtime
   * @deprecated Use setProperty('atmosphere.intensity', value) instead
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    if (this.atmosphereMesh) {
      const material = this.atmosphereMesh.material as THREE.ShaderMaterial;
      material.uniforms.intensity.value = intensity;
    }
  }
}
