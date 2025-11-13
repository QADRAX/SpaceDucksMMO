import { CelestialBody } from '../CelestialBody';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import {
  TextureComponent,
  CoronaComponent,
  LightEmissionComponent,
  RotationComponent,
} from '../components';

/**
 * Configuration for building a star
 */
export interface StarBuilderConfig {
  radius?: number;
  textureId?: string;
  coronaColor?: number;
  coronaRadius?: number;
  coronaIntensity?: number;
  coronaPulse?: boolean;
  lightIntensity?: number;
  lightRange?: number;
  lightColor?: number;
  rotationSpeed?: number;
  emissiveColor?: number;
  emissiveIntensity?: number;
}

/**
 * Builder for creating star celestial bodies with common presets.
 * 
 * @example
 * ```ts
 * const sun = StarBuilder.create('sun', textureResolver, {
 *   radius: 1.2,
 *   coronaColor: 0xffdd44,
 *   lightIntensity: 6.0
 * });
 * ```
 */
export class StarBuilder {
  static create(
    id: string,
    textureResolver: TextureResolverService,
    config: StarBuilderConfig = {}
  ): CelestialBody {
    const {
      radius = 1.2,
      textureId = 'sun',
      coronaColor = 0xffdd44,
      coronaRadius = 1.4,
      coronaIntensity = 1.5,
      coronaPulse = true,
      lightIntensity = 6.0,
      lightRange = 15,
      lightColor = 0xffaa44,
      rotationSpeed = 0.1,
      emissiveColor = 0xffaa00,
      emissiveIntensity = 2.0,
    } = config;

    const star = new CelestialBody(id, {
      radius,
      segments: 64,
      emissive: emissiveColor,
      emissiveIntensity,
      roughness: 1.0,
      metalness: 0.0,
      receiveShadows: false,
      castShadows: false,
    });

    // Add texture
    star.addComponent(
      new TextureComponent(textureResolver, {
        textureId: textureId as any,
        textureType: 'diffuse',
        applyAsEmissive: true,
      })
    );

    // Add corona glow
    star.addComponent(
      new CoronaComponent({
        color: coronaColor,
        radiusMultiplier: coronaRadius,
        intensity: coronaIntensity,
        enablePulse: coronaPulse,
        pulseSpeed: 1.0,
      })
    );

    // Add light emission
    star.addComponent(
      new LightEmissionComponent({
        color: lightColor,
        intensity: lightIntensity,
        range: lightRange,
        castShadow: true,
      })
    );

    // Add rotation
    star.addComponent(
      new RotationComponent({
        speed: rotationSpeed,
      })
    );

    return star;
  }
}
