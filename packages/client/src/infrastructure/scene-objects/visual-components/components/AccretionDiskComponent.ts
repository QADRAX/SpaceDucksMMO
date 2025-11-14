import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

export interface AccretionDiskConfig {
  innerRadius: number;
  outerRadius: number;
  innerColor: number;
  outerColor: number;
  rotationSpeed: number;
  segments?: number;
  opacity?: number;
  emissiveIntensity?: number;
}

/**
 * Accretion disk component for black holes.
 * Creates a rotating disk of hot matter spiraling into the black hole.
 * 
 * Features:
 * - Gradient from hot inner edge to cooler outer edge
 * - Rotation animation
 * - Additive blending for glow effect
 * - Semi-transparent with emissive properties
 */
export class AccretionDiskComponent implements IInspectableComponent {
  private diskMesh?: THREE.Mesh;
  private config: Required<AccretionDiskConfig>;
  private parentMesh?: THREE.Mesh;

  constructor(config: AccretionDiskConfig) {
    this.config = {
      innerRadius: config.innerRadius,
      outerRadius: config.outerRadius,
      innerColor: config.innerColor,
      outerColor: config.outerColor,
      rotationSpeed: config.rotationSpeed,
      segments: config.segments ?? 128,
      opacity: config.opacity ?? 0.8,
      emissiveIntensity: config.emissiveIntensity ?? 2.0,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;

    // Create ring geometry for accretion disk
    const geometry = new THREE.RingGeometry(
      this.config.innerRadius,
      this.config.outerRadius,
      this.config.segments,
      16
    );

    // Create custom shader material for gradient effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        innerColor: { value: new THREE.Color(this.config.innerColor) },
        outerColor: { value: new THREE.Color(this.config.outerColor) },
        innerRadius: { value: this.config.innerRadius },
        outerRadius: { value: this.config.outerRadius },
        emissiveIntensity: { value: this.config.emissiveIntensity },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        uniform float innerRadius;
        uniform float outerRadius;
        uniform float emissiveIntensity;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Calculate distance from center
          float dist = length(vPosition.xy);
          
          // Normalize to 0-1 range within ring
          float t = (dist - innerRadius) / (outerRadius - innerRadius);
          
          // Color gradient from hot inner to cool outer
          vec3 color = mix(innerColor, outerColor, t);
          
          // Add some variation/noise for more realistic look
          float noise = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
          color += noise * 0.1;
          
          // Fade near edges
          float edgeFade = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);
          
          // Apply emissive
          vec3 emissive = color * emissiveIntensity;
          
          gl_FragColor = vec4(color + emissive, edgeFade);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.diskMesh = new THREE.Mesh(geometry, material);
    
    // Position and orient disk
    this.diskMesh.position.copy(parentMesh.position);
    this.diskMesh.rotation.x = Math.PI / 2; // Lay flat
    
    scene.add(this.diskMesh);
  }

  update(deltaTime: number): void {
    if (!this.diskMesh) return;

    // Keep disk synchronized with parent position
    if (this.parentMesh) {
      this.diskMesh.position.copy(this.parentMesh.position);
    }

    // Rotate disk
    this.diskMesh.rotation.z += this.config.rotationSpeed * deltaTime * 0.001;
  }

  dispose(scene: THREE.Scene): void {
    if (this.diskMesh) {
      scene.remove(this.diskMesh);
      this.diskMesh.geometry.dispose();
      (this.diskMesh.material as THREE.Material).dispose();
      this.diskMesh = undefined;
    }
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'disk.innerColor',
        label: 'Disk Inner Color',
        type: 'color',
        value: this.config.innerColor,
        description: 'Hot inner edge color of accretion disk'
      },
      {
        name: 'disk.outerColor',
        label: 'Disk Outer Color',
        type: 'color',
        value: this.config.outerColor,
        description: 'Cool outer edge color of accretion disk'
      },
      {
        name: 'disk.rotationSpeed',
        label: 'Disk Rotation Speed',
        type: 'number',
        value: this.config.rotationSpeed,
        min: 0,
        max: 2,
        step: 0.05,
        description: 'Speed of disk rotation'
      },
      {
        name: 'disk.opacity',
        label: 'Disk Opacity',
        type: 'number',
        value: this.config.opacity,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Transparency of accretion disk'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'innerColor') {
      this.config.innerColor = value;
      if (this.diskMesh) {
        const material = this.diskMesh.material as THREE.ShaderMaterial;
        material.uniforms.innerColor.value = new THREE.Color(value);
      }
    } else if (propName === 'outerColor') {
      this.config.outerColor = value;
      if (this.diskMesh) {
        const material = this.diskMesh.material as THREE.ShaderMaterial;
        material.uniforms.outerColor.value = new THREE.Color(value);
      }
    } else if (propName === 'rotationSpeed') {
      this.config.rotationSpeed = value;
    } else if (propName === 'opacity') {
      this.config.opacity = value;
      if (this.diskMesh) {
        (this.diskMesh.material as THREE.ShaderMaterial).opacity = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'innerColor') return this.config.innerColor;
    if (propName === 'outerColor') return this.config.outerColor;
    if (propName === 'rotationSpeed') return this.config.rotationSpeed;
    if (propName === 'opacity') return this.config.opacity;
    
    return undefined;
  }
}
