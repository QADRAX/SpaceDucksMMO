/**
 * Visual components system - generic 3D rendering through composition
 * 
 * This system uses composition over inheritance with modular components.
 * VisualBody is infrastructure-level (generic 3D container), while domain objects
 * (Sun, Planet, BlackHole) define which components to use.
 * 
 * ## Architecture
 * 
 * - **VisualBody**: Generic 3D object container (pure infrastructure)
 * - **CelestialBody**: Legacy alias, will be deprecated
 * - **Components**: Modular rendering features (geometry, material, effects)
 * - **Builders**: Domain factories for common celestial body types
 * 
 * ## Usage
 * 
 * ### Using Builders (recommended for celestial bodies)
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
 * ### Using VisualBody Directly (for custom objects)
 * ```ts
 * import { VisualBody } from '@client/infrastructure/scene-objects/visual-components';
 * import { 
 *   GeometryComponent,
 *   MaterialComponent,
 *   EmissiveComponent,
 *   CoronaComponent 
 * } from '@client/infrastructure/scene-objects/visual-components/components';
 * 
 * const custom = new VisualBody('custom-star')
 *   .addComponent(new GeometryComponent({ type: 'sphere', radius: 2.0 }))
 *   .addComponent(new MaterialComponent({ color: 0xffaa00 }))
 *   .addComponent(new EmissiveComponent({ color: 0xffdd44, intensity: 2.0 }))
 *   .addComponent(new CoronaComponent({ color: 0xff0000, radiusMultiplier: 2.0 }));
 * ```
 */

// Core visual body (generic 3D object container)
export { VisualBody } from './VisualBody';

// Export component-based objects
export { Skybox as ComponentSkybox } from './Skybox';
export type { SkyboxConfig, SkyboxTexture } from './Skybox';

// Components (explicit exports to avoid type/value confusion)
export type { IVisualComponent, IInspectableComponent } from './components';
export { 
  GeometryComponent,
  MaterialComponent,
  EmissiveComponent,
  TextureComponent,
  TintComponent,
  BrightnessComponent,
  AtmosphereComponent,
  CoronaComponent,
  LightEmissionComponent,
  RotationComponent,
  AccretionDiskComponent,
  EventHorizonComponent,
  JetStreamComponent
} from './components';
export type {
  GeometryComponentConfig,
  MaterialComponentConfig,
  EmissiveComponentConfig,
  TextureComponentConfig,
  TintComponentConfig,
  BrightnessComponentConfig,
  AtmosphereComponentConfig,
  CoronaComponentConfig,
  LightEmissionComponentConfig,
  RotationComponentConfig,
  AccretionDiskConfig,
  EventHorizonConfig,
  JetStreamConfig
} from './components';

// Builders
export { StarBuilder, PlanetBuilder, SkyboxBuilder, BlackHoleBuilder } from './builders';
export type { StarBuilderConfig, PlanetBuilderConfig, SkyboxBuilderConfig, BlackHoleBuilderConfig } from './builders';
