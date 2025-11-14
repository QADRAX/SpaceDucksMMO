import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

export interface JetStreamConfig {
  length: number;
  radius: number;
  color: number;
  intensity: number;
  particleCount?: number;
  speed?: number;
}

/**
 * Jet stream component for black holes.
 * Creates relativistic jets shooting out from the poles.
 * 
 * Features:
 * - Particle-based jets from both poles
 * - Animated particle flow
 * - Bright emission effect
 * - Additive blending for energy appearance
 */
export class JetStreamComponent implements IInspectableComponent {
  private jetParticles?: THREE.Points;
  private config: Required<JetStreamConfig>;
  private particlePositions: Float32Array;
  private particleVelocities: Float32Array;
  private time: number = 0;
  private parentMesh?: THREE.Mesh;

  constructor(config: JetStreamConfig) {
    this.config = {
      length: config.length,
      radius: config.radius,
      color: config.color,
      intensity: config.intensity,
      particleCount: config.particleCount ?? 200,
      speed: config.speed ?? 2.0,
    };

    // Initialize particle data
    this.particlePositions = new Float32Array(this.config.particleCount * 3);
    this.particleVelocities = new Float32Array(this.config.particleCount);
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;

    const geometry = new THREE.BufferGeometry();

    // Initialize particle positions and velocities
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      
      // Random position along jet
      const t = Math.random();
      const distance = t * this.config.length;
      
      // Random radial offset
      const angle = Math.random() * Math.PI * 2;
      const radialOffset = Math.random() * this.config.radius * (1.0 - t); // Narrower at far end
      
      // Split between top and bottom jets
      const direction = i < this.config.particleCount / 2 ? 1 : -1;
      
      this.particlePositions[i3] = Math.cos(angle) * radialOffset;
      this.particlePositions[i3 + 1] = distance * direction;
      this.particlePositions[i3 + 2] = Math.sin(angle) * radialOffset;
      
      this.particleVelocities[i] = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      color: this.config.color,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.jetParticles = new THREE.Points(geometry, material);
    this.jetParticles.position.copy(parentMesh.position);
    
    scene.add(this.jetParticles);
  }

  update(deltaTime: number): void {
    if (!this.jetParticles) return;

    // Keep jets synchronized with parent position
    if (this.parentMesh) {
      this.jetParticles.position.copy(this.parentMesh.position);
    }

    this.time += deltaTime;

    // Animate particles
    const positions = this.jetParticles.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const i3 = i * 3;
      
      // Move particle outward
      const direction = i < this.config.particleCount / 2 ? 1 : -1;
      positions[i3 + 1] += this.config.speed * deltaTime * 0.001 * this.particleVelocities[i] * direction;
      
      // Reset particle if it goes too far
      if (Math.abs(positions[i3 + 1]) > this.config.length) {
        positions[i3 + 1] = 0;
        
        // Randomize radial position
        const angle = Math.random() * Math.PI * 2;
        const radialOffset = Math.random() * this.config.radius * 0.2;
        positions[i3] = Math.cos(angle) * radialOffset;
        positions[i3 + 2] = Math.sin(angle) * radialOffset;
      }
    }

    this.jetParticles.geometry.attributes.position.needsUpdate = true;
  }

  dispose(scene: THREE.Scene): void {
    if (this.jetParticles) {
      scene.remove(this.jetParticles);
      this.jetParticles.geometry.dispose();
      (this.jetParticles.material as THREE.Material).dispose();
      this.jetParticles = undefined;
    }
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      { name: 'jet.color', label: 'Jet Color', type: 'color', value: this.config.color },
      { name: 'jet.speed', label: 'Jet Speed', type: 'number', value: this.config.speed, min: 0, max: 5, step: 0.1 },
      { name: 'jet.intensity', label: 'Jet Intensity', type: 'number', value: this.config.intensity, min: 0, max: 2, step: 0.1 },
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'color') {
      this.config.color = value;
      if (this.jetParticles) {
        (this.jetParticles.material as THREE.PointsMaterial).color.setHex(value);
      }
    } else if (propName === 'speed') {
      this.config.speed = value;
    } else if (propName === 'intensity') {
      this.config.intensity = value;
      if (this.jetParticles) {
        (this.jetParticles.material as THREE.PointsMaterial).opacity = 0.8 * value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.color;
    if (propName === 'speed') return this.config.speed;
    if (propName === 'intensity') return this.config.intensity;
    
    return undefined;
  }
}
