import { VisualBody } from '../VisualBody';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import {
  GeometryComponent,
  MaterialComponent,
  TextureComponent,
  TintComponent,
  AtmosphereComponent,
  RotationComponent,
} from '../components';

/**
 * Configuration for building a planet
 */
export interface PlanetBuilderConfig {
  radius?: number;
  textureId?: string;
  tintColor?: number;
  tintIntensity?: number;
  hasAtmosphere?: boolean;
  atmosphereColor?: number;
  atmosphereThickness?: number;
  atmosphereIntensity?: number;
  rotationSpeed?: number;
  roughness?: number;
  metalness?: number;
}

/**
 * Builder for creating planet celestial bodies.
 * 
 * @example
 * ```ts
 * const mars = PlanetBuilder.create('mars', textureResolver, {
 *   radius: 0.5,
 *   tintColor: 0xff6644,
 *   tintIntensity: 0.3,
 *   hasAtmosphere: true,
 *   atmosphereColor: 0xffaa88
 * });
 * ```
 */
export class PlanetBuilder {
  static create(
    id: string,
    textureResolver: TextureResolverService,
    config: PlanetBuilderConfig = {}
  ): VisualBody {
    const {
      radius = 1.0,
      textureId = 'rocky-planet',
      tintColor = 0xffffff,
      tintIntensity = 0,
      hasAtmosphere = false,
      atmosphereColor = 0x88ccff,
      atmosphereThickness = 1.05,
      atmosphereIntensity = 2.0,
      rotationSpeed = 0.05,
      roughness = 0.9,
      metalness = 0.1,
    } = config;

    const planet = new VisualBody(id);

    // Add base components
    planet.addComponent(
      new GeometryComponent({
        type: 'sphere',
        radius,
        segments: 128,
      })
    );

    planet.addComponent(
      new MaterialComponent({
        color: 0xffffff,
        roughness,
        metalness,
        receiveShadows: true,
        castShadows: true,
      })
    );

    // Add texture
    planet.addComponent(
      new TextureComponent(textureResolver, {
        textureId: textureId as any,
        textureType: 'diffuse',
      })
    );

    // Add tint if configured
    if (tintIntensity > 0) {
      planet.addComponent(
        new TintComponent({
          tintColor,
          intensity: tintIntensity,
        })
      );
    }

    // Add atmosphere if enabled
    if (hasAtmosphere) {
      planet.addComponent(
        new AtmosphereComponent({
          color: atmosphereColor,
          thickness: atmosphereThickness,
          intensity: atmosphereIntensity,
        })
      );
    }

    // Add rotation
    planet.addComponent(
      new RotationComponent({
        speed: rotationSpeed,
      })
    );

    return planet;
  }
}
