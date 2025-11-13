/**
 * Celestial body system - component-based, clean architecture
 * 
 * This system uses composition over inheritance with modular components.
 * 
 * ## Architecture
 * 
 * - **CelestialBody**: Base class that composes components
 * - **Components**: Modular effects (texture, tint, atmosphere, corona, light, rotation)
 * - **Builders**: Factory functions to create common types (stars, planets)
 * 
 * ## Usage
 * 
 * ### Using Builders (recommended for common types)
 * ```ts
 * import { StarBuilder, PlanetBuilder } from '@client/infrastructure/scene-objects/visual-components';
 * 
 * const sun = StarBuilder.create('sun', textureResolver, {
 *   radius: 1.2,
 *   coronaColor: 0xffdd44,
 *   lightIntensity: 6.0
 * });
 * 
 * const mars = PlanetBuilder.create('mars', textureResolver, {
 *   radius: 0.5,
 *   tintColor: 0xff6644,
 *   hasAtmosphere: true
 * });
 * ```
 * 
 * ### Using Components Directly (for custom bodies)
 * ```ts
 * import { CelestialBody } from '@client/infrastructure/scene-objects/visual-components';
 * import { TextureComponent, CoronaComponent } from '@client/infrastructure/scene-objects/visual-components/components';
 * 
 * const custom = new CelestialBody('custom', { radius: 2.0 });
 * custom.addComponent(new TextureComponent(resolver, { textureId: 'sun' }));
 * custom.addComponent(new CoronaComponent({ color: 0xff0000, radiusMultiplier: 2.0 }));
 * ```
 */

export { CelestialBody } from './CelestialBody';
export type { CelestialBodyBaseConfig } from './CelestialBody';

// Export component-based objects
export { Skybox as ComponentSkybox } from './Skybox';
export type { SkyboxConfig, SkyboxTexture } from './Skybox';

// Components (explicit exports to avoid type/value confusion)
export type { ICelestialComponent } from './components';
export { 
  TextureComponent,
  TintComponent,
  BrightnessComponent,
  AtmosphereComponent,
  CoronaComponent,
  LightEmissionComponent,
  RotationComponent
} from './components';
export type {
  TextureComponentConfig,
  TintComponentConfig,
  BrightnessComponentConfig,
  AtmosphereComponentConfig,
  CoronaComponentConfig,
  LightEmissionComponentConfig,
  RotationComponentConfig
} from './components';

// Builders
export { StarBuilder, PlanetBuilder, SkyboxBuilder } from './builders';
export type { StarBuilderConfig, PlanetBuilderConfig, SkyboxBuilderConfig } from './builders';
