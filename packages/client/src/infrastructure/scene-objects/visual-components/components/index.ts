/**
 * Visual components - modular, composable effects
 */

export type { IVisualComponent, IInspectableComponent } from './IVisualComponent';

// Base components (geometry, material, emissive)
export { GeometryComponent } from './GeometryComponent';
export type { GeometryComponentConfig } from './GeometryComponent';

export { MaterialComponent } from './MaterialComponent';
export type { MaterialComponentConfig } from './MaterialComponent';

export { EmissiveComponent } from './EmissiveComponent';
export type { EmissiveComponentConfig } from './EmissiveComponent';

// Visual effect components
export { TextureComponent } from './TextureComponent';
export type { TextureComponentConfig } from './TextureComponent';

export { TintComponent } from './TintComponent';
export type { TintComponentConfig } from './TintComponent';

export { BrightnessComponent } from './BrightnessComponent';
export type { BrightnessComponentConfig } from './BrightnessComponent';

export { AtmosphereComponent } from './AtmosphereComponent';
export type { AtmosphereComponentConfig } from './AtmosphereComponent';

export { CoronaComponent } from './CoronaComponent';
export type { CoronaComponentConfig } from './CoronaComponent';

export { LightEmissionComponent } from './LightEmissionComponent';
export type { LightEmissionComponentConfig } from './LightEmissionComponent';

export { RotationComponent } from './RotationComponent';
export type { RotationComponentConfig } from './RotationComponent';

export { AccretionDiskComponent } from './AccretionDiskComponent';
export type { AccretionDiskConfig } from './AccretionDiskComponent';

export { EventHorizonComponent } from './EventHorizonComponent';
export type { EventHorizonConfig } from './EventHorizonComponent';

export { JetStreamComponent } from './JetStreamComponent';
export type { JetStreamConfig } from './JetStreamComponent';
