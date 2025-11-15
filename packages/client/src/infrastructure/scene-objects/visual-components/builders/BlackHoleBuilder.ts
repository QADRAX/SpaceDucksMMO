import { VisualBody } from '../VisualBody';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import * as THREE from 'three';
import {
  GeometryComponent,
  MaterialComponent,
  AccretionDiskComponent,
  EventHorizonComponent,
  JetStreamComponent,
  RotationComponent,
  GravitationalLensingComponent,
} from '../components';

/**
 * Configuration for building a black hole
 */
export interface BlackHoleBuilderConfig {
  radius?: number;
  
  // Event Horizon config
  horizonMultiplier?: number;
  horizonColor?: number;
  horizonPulse?: boolean;
  horizonPulseSpeed?: number;
  
  // Accretion Disk config
  diskInnerRadius?: number; // Offset from parent surface
  diskOuterRadius?: number; // Offset from parent surface
  diskInnerColor?: number;
  diskOuterColor?: number;
  diskRotationSpeed?: number;
  diskOpacity?: number;
  diskTurbulence?: number;
  diskDopplerEffect?: boolean;
  
  // Jet Stream config
  enableJets?: boolean;
  jetLength?: number;
  jetRadius?: number;
  jetColor?: number;
  jetParticleCount?: number;
  jetSpeed?: number;
  
  // Gravitational Lensing (post-processing)
  enableLensing?: boolean;
  lensingStrength?: number;
  lensingRadius?: number; // Offset from parent surface
  lensingFalloff?: number;
  bloomStrength?: number;
  
  // Core rotation
  rotationSpeed?: number;
}

/**
 * Builder for creating black hole celestial bodies.
 * 
 * Black holes feature:
 * - Dark central sphere (event horizon) with subtle distortion
 * - Bright accretion disk with gradient colors
 * - Optional relativistic jets from poles
 * - Rotation effects
 * 
 * @example
 * ```ts
 * const blackHole = BlackHoleBuilder.create('black-hole-1', textureResolver, {
 *   radius: 0.8,
 *   diskInnerColor: 0xff4400,
 *   diskOuterColor: 0x4444ff,
 *   enableJets: true
 * });
 * ```
 */
export class BlackHoleBuilder {
  static create(
    id: string,
    textureResolver: TextureResolverService,
    config: BlackHoleBuilderConfig = {}
  ): VisualBody {
    const {
      radius = 0.8,
      
      // Event Horizon
      horizonMultiplier = 1.3,
      horizonColor = 0x000000,
      horizonPulse = true,
      horizonPulseSpeed = 0.5,
      
      // Accretion Disk
      diskInnerRadius = 0.2, // Offset from surface
      diskOuterRadius = 2.5, // Offset from surface
      diskInnerColor = 0xffaa00,
      diskOuterColor = 0x4488ff,
      diskRotationSpeed = 0.5,
      diskOpacity = 0.8,
      diskTurbulence = 0.5,
      diskDopplerEffect = true,
      
      // Jet Streams
      enableJets = true,
      jetLength = 5.0,
      jetRadius = 0.3,
      jetColor = 0x88ccff,
      jetParticleCount = 200,
      jetSpeed = 2.0,
      
      // Gravitational Lensing
      enableLensing = true,
      lensingStrength = 1.0,
      lensingRadius = 4.0, // Offset from parent surface
      lensingFalloff = 0.15,
      bloomStrength = 1.5,
      
      // Core rotation
      rotationSpeed = 0.05,
    } = config;

    // Create the core black hole
    const blackHole = new VisualBody(id);

    // Add base components
    blackHole.addComponent(
      new GeometryComponent({
        type: 'sphere',
        radius,
        segments: 64,
      })
    );

    blackHole.addComponent(
      new MaterialComponent({
        color: 0x000000,
        roughness: 0.0,
        metalness: 1.0,
        receiveShadows: false,
        castShadows: false,
      })
    );

    // Add event horizon effect
    blackHole.addComponent(
      new EventHorizonComponent({
        radiusMultiplier: horizonMultiplier,
        color: horizonColor,
        distortionStrength: 0.1,
        pulseSpeed: horizonPulseSpeed,
        enablePulse: horizonPulse,
      })
    );

    // Add accretion disk
    blackHole.addComponent(
      new AccretionDiskComponent({
        innerRadius: diskInnerRadius,
        outerRadius: diskOuterRadius,
        innerColor: diskInnerColor,
        outerColor: diskOuterColor,
        rotationSpeed: diskRotationSpeed,
        segments: 256,
        opacity: diskOpacity,
        emissiveIntensity: 4.0,
        turbulence: diskTurbulence,
        turbulenceScale: 3.0,
        dopplerEffect: diskDopplerEffect,
        relativisticSpeed: 0.3,
      })
    );

    // Add gravitational lensing post-processing
    if (enableLensing) {
      blackHole.addComponent(
        new GravitationalLensingComponent({
          strength: lensingStrength,
          radius: lensingRadius,
          falloff: lensingFalloff,
          enableBloom: true,
          bloomStrength: bloomStrength,
          bloomRadius: 0.8,
          bloomThreshold: 0.3,
        })
      );
    }

    // Add jet streams if enabled
    if (enableJets) {
      blackHole.addComponent(
        new JetStreamComponent({
          length: jetLength,
          radius: jetRadius,
          color: jetColor,
          intensity: 1.5,
          particleCount: jetParticleCount,
          speed: jetSpeed,
        })
      );
    }

    // Add slow rotation to core
    if (rotationSpeed > 0) {
      blackHole.addComponent(
        new RotationComponent({
          axis: new THREE.Vector3(0, 1, 0),
          speed: rotationSpeed,
        })
      );
    }

    return blackHole;
  }

  /**
   * Create a supermassive black hole preset (larger, more intense)
   */
  static createSupermassive(
    id: string,
    textureResolver: TextureResolverService
  ): VisualBody {
    return BlackHoleBuilder.create(id, textureResolver, {
      radius: 1.5,
      diskInnerRadius: 2.0,
      diskOuterRadius: 6.0,
      diskInnerColor: 0xff2200,
      diskOuterColor: 0x2244ff,
      diskRotationSpeed: 0.3,
      jetLength: 8.0,
      jetRadius: 0.5,
      jetParticleCount: 300,
      jetSpeed: 3.0,
    });
  }

  /**
   * Create a stellar black hole preset (smaller, quieter)
   */
  static createStellar(
    id: string,
    textureResolver: TextureResolverService
  ): VisualBody {
    return BlackHoleBuilder.create(id, textureResolver, {
      radius: 0.5,
      diskInnerRadius: 0.8,
      diskOuterRadius: 2.0,
      diskInnerColor: 0xffcc44,
      diskOuterColor: 0x6666ff,
      diskRotationSpeed: 0.8,
      enableJets: false,
      rotationSpeed: 0.1,
    });
  }

  /**
   * Create a quasar preset (extremely active with bright jets)
   */
  static createQuasar(
    id: string,
    textureResolver: TextureResolverService
  ): VisualBody {
    return BlackHoleBuilder.create(id, textureResolver, {
      radius: 1.2,
      diskInnerRadius: 1.8,
      diskOuterRadius: 5.0,
      diskInnerColor: 0xffffff,
      diskOuterColor: 0x0088ff,
      diskRotationSpeed: 0.7,
      enableJets: true,
      jetLength: 10.0,
      jetRadius: 0.4,
      jetColor: 0xccffff,
      jetParticleCount: 400,
      jetSpeed: 4.0,
    });
  }
}
