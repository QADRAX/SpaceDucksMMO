import type { ComponentBase } from '../core';

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
