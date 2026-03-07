import type { ComponentBase } from '../../../ecs/component';
import type { ComponentSpec } from '../../../types/componentSpec';

/** Shared light parameters. */
export interface LightBaseComponent extends ComponentBase {
  color: string;
  intensity: number;
}

/** Ambient light component. */
export interface AmbientLightComponent extends LightBaseComponent {
  type: 'ambientLight';
}

/** Directional light component. */
export interface DirectionalLightComponent extends LightBaseComponent {
  type: 'directionalLight';
  castShadow: boolean;
}

/** Point light component. */
export interface PointLightComponent extends LightBaseComponent {
  type: 'pointLight';
  distance: number;
  decay: number;
  castShadow: boolean;
}

/** Spot light component. */
export interface SpotLightComponent extends LightBaseComponent {
  type: 'spotLight';
  distance: number;
  angle: number;
  penumbra: number;
  castShadow: boolean;
}

/** Union of all light components. */
export type LightComponent =
  | AmbientLightComponent
  | DirectionalLightComponent
  | PointLightComponent
  | SpotLightComponent;

/** Ambient light spec. */
export const AMBIENT_LIGHT_SPEC: ComponentSpec<AmbientLightComponent> = {
  metadata: {
    type: 'ambientLight',
    label: 'Ambient Light',
    description: 'Uniform ambient light affecting all scene objects.',
    category: 'Lighting',
    icon: 'Sun',
    unique: true,
    conflicts: ['directionalLight', 'pointLight', 'spotLight'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'intensity', label: 'Intensity', type: 'number', min: 0, step: 0.01 },
      ],
    },
  },
  defaults: { color: '#ffffff', intensity: 1 },
};

/** Directional light spec. */
export const DIRECTIONAL_LIGHT_SPEC: ComponentSpec<DirectionalLightComponent> = {
  metadata: {
    type: 'directionalLight',
    label: 'Directional Light',
    description: 'Directional light with parallel rays, ideal for sunlight.',
    category: 'Lighting',
    icon: 'SunMedium',
    unique: true,
    conflicts: ['ambientLight', 'pointLight', 'spotLight'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'intensity', label: 'Intensity', type: 'number', min: 0, step: 0.01 },
        { key: 'castShadow', label: 'Cast Shadow', type: 'boolean' },
      ],
    },
  },
  defaults: { color: '#ffffff', intensity: 1, castShadow: true },
};

/** Point light spec. */
export const POINT_LIGHT_SPEC: ComponentSpec<PointLightComponent> = {
  metadata: {
    type: 'pointLight',
    label: 'Point Light',
    description: 'Omnidirectional light emitted from a single point.',
    category: 'Lighting',
    icon: 'Lightbulb',
    unique: true,
    conflicts: ['ambientLight', 'directionalLight', 'spotLight'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'intensity', label: 'Intensity', type: 'number', min: 0, step: 0.01 },
        { key: 'distance', label: 'Distance', type: 'number', min: 0, step: 0.1 },
        { key: 'decay', label: 'Decay', type: 'number', min: 0, step: 0.1 },
        { key: 'castShadow', label: 'Cast Shadow', type: 'boolean' },
      ],
    },
  },
  defaults: { color: '#ffffff', intensity: 1, distance: 0, decay: 2, castShadow: true },
};

/** Spot light spec. */
export const SPOT_LIGHT_SPEC: ComponentSpec<SpotLightComponent> = {
  metadata: {
    type: 'spotLight',
    label: 'Spot Light',
    description: 'Cone-shaped light with angle and penumbra controls.',
    category: 'Lighting',
    icon: 'Flashlight',
    unique: true,
    conflicts: ['ambientLight', 'directionalLight', 'pointLight'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'intensity', label: 'Intensity', type: 'number', min: 0, step: 0.01 },
        { key: 'distance', label: 'Distance', type: 'number', min: 0, step: 0.1 },
        { key: 'angle', label: 'Angle', type: 'number', min: 0.01, max: 1.5708, step: 0.01 },
        { key: 'penumbra', label: 'Penumbra', type: 'number', min: 0, max: 1, step: 0.01 },
        { key: 'castShadow', label: 'Cast Shadow', type: 'boolean' },
      ],
    },
  },
  defaults: {
    color: '#ffffff',
    intensity: 1,
    distance: 0,
    angle: Math.PI / 3,
    penumbra: 0,
    castShadow: true,
  },
};

/** All light component specs keyed by type. */
export const LIGHT_SPECS = {
  ambientLight: AMBIENT_LIGHT_SPEC,
  directionalLight: DIRECTIONAL_LIGHT_SPEC,
  pointLight: POINT_LIGHT_SPEC,
  spotLight: SPOT_LIGHT_SPEC,
};
