import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { GeometryComponent } from './GeometryComponent';
import * as THREE from 'three';

/**
 * Configuration for corona glow effect (for stars)
 */
export interface CoronaComponentConfig {
  color: number;
  radiusMultiplier: number; // Height above surface (offset from geometry radius)
  intensity: number;
  enablePulse?: boolean;
  pulseSpeed?: number;
}

/**
 * Component that adds a corona/glow effect around stars.
 * Uses Fresnel shader with optional pulsing animation.
 */
export class CoronaComponent implements IInspectableComponent {
  private config: Required<CoronaComponentConfig>;
  private coronaMesh?: THREE.Mesh;
  private parentMesh?: THREE.Mesh;
  private parentRadius: number = 1.0;
  private time: number = 0;
  private scene?: THREE.Scene;
  private disposed: boolean = false;

  constructor(config: CoronaComponentConfig) {
    this.config = {
      color: config.color,
      radiusMultiplier: config.radiusMultiplier,
      intensity: config.intensity,
      enablePulse: config.enablePulse ?? false,
      pulseSpeed: config.pulseSpeed ?? 1.0,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void {
    this.disposed = false; // Reset disposed flag
    this.scene = scene;
    this.parentMesh = parentMesh;
    const bbox = new THREE.Box3().setFromObject(parentMesh);
    this.parentRadius = (bbox.max.x - bbox.min.x) / 2;

    // Subscribe to geometry changes if available
    if (visualBody && visualBody.getComponent) {
      const geometryComp = visualBody.getComponent(GeometryComponent);
      if (geometryComp) {
        geometryComp.onGeometryChanged(this.handleGeometryChange);
      }
    }

    this.createCorona(scene);
  }

  private handleGeometryChange = (newRadius: number): void => {
    if (this.disposed) return; // Don't recreate if disposed
    
    this.parentRadius = newRadius;
    if (this.scene && this.parentMesh) {
      // Remove existing mesh WITHOUT marking component disposed to allow future updates
      this.removeCoronaMesh(this.scene);
      this.createCorona(this.scene);
    }
  };

  private createCorona(scene: THREE.Scene): void {
    // Corona radius = base radius + height offset
    const coronaRadius = this.parentRadius + this.config.radiusMultiplier;
    
    const coronaGeometry = new THREE.SphereGeometry(
      coronaRadius,
      64,
      64
    );

    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(this.config.color) },
        intensity: { value: this.config.intensity },
        time: { value: 0 },
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
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);
          
          gl_FragColor = vec4(glowColor, fresnel * intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
    if (this.parentMesh) {
      this.coronaMesh.position.copy(this.parentMesh.position);
    }
    scene.add(this.coronaMesh);
  }

  update(deltaTime: number): void {
    if (!this.coronaMesh) return;

    // Keep corona synchronized with parent position
    if (this.parentMesh) {
      this.coronaMesh.position.copy(this.parentMesh.position);
    }

    // Update pulse animation
    if (this.config.enablePulse) {
      this.time += deltaTime;
      const material = this.coronaMesh.material as THREE.ShaderMaterial;
      
      // Pulse between 0.8x and 1.2x intensity
      const pulse = Math.sin(this.time * this.config.pulseSpeed * 0.002) * 0.2;
      material.uniforms.intensity.value = this.config.intensity * (1.0 + pulse);
    }
  }

  dispose(scene: THREE.Scene): void {
    this.disposed = true; // Mark as disposed to prevent recreation
    
    this.removeCoronaMesh(scene);
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'corona.color',
        label: 'Corona Color',
        type: 'color',
        value: this.config.color,
        description: 'Color of star corona'
      },
      {
        name: 'corona.radius',
        label: 'Corona Height',
        type: 'number',
        value: this.config.radiusMultiplier,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        description: 'Height above surface (offset from geometry radius)'
      },
      {
        name: 'corona.intensity',
        label: 'Corona Intensity',
        type: 'number',
        value: this.config.intensity,
        min: 0,
        max: 3,
        step: 0.1,
        description: 'Brightness of corona glow'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1]; // Extract 'color' from 'corona.color'
    
    if (propName === 'color') {
      this.config.color = value;
      if (this.coronaMesh) {
        const material = this.coronaMesh.material as THREE.ShaderMaterial;
        material.uniforms.glowColor.value = new THREE.Color(value);
      }
    } else if (propName === 'radius') {
      this.config.radiusMultiplier = value;
      // Recreate corona mesh with new size
      if (this.parentMesh && this.scene) {
        this.removeCoronaMesh(this.scene);
        this.createCorona(this.scene);
      }
    } else if (propName === 'intensity') {
      this.config.intensity = value;
      if (this.coronaMesh) {
        const material = this.coronaMesh.material as THREE.ShaderMaterial;
        material.uniforms.intensity.value = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.color;
    if (propName === 'radius') return this.config.radiusMultiplier;
    if (propName === 'intensity') return this.config.intensity;
    
    return undefined;
  }

  /**
   * Update corona intensity at runtime
   * @deprecated Use setProperty('corona.intensity', value) instead
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
  }

  // Removes the corona mesh resources without altering disposed state (used for recreation)
  private removeCoronaMesh(scene: THREE.Scene): void {
    if (!this.coronaMesh) return;
    scene.remove(this.coronaMesh);
    this.coronaMesh.geometry.dispose();
    (this.coronaMesh.material as THREE.Material).dispose();
    this.coronaMesh = undefined;
  }
}
