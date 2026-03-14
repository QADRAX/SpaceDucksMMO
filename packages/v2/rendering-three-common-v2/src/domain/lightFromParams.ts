import * as THREE from 'three';

/** Color as number (e.g. from parseColor). */
export type LightColor = number;

export interface AmbientLightParams {
  type: 'ambientLight';
  color: LightColor;
  intensity: number;
}

export interface DirectionalLightParams {
  type: 'directionalLight';
  color: LightColor;
  intensity: number;
  castShadow: boolean;
}

export interface PointLightParams {
  type: 'pointLight';
  color: LightColor;
  intensity: number;
  distance: number;
  decay: number;
  castShadow: boolean;
}

export interface SpotLightParams {
  type: 'spotLight';
  color: LightColor;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  castShadow: boolean;
}

export type LightParams =
  | AmbientLightParams
  | DirectionalLightParams
  | PointLightParams
  | SpotLightParams;

/**
 * Creates a Three.js Light from resolved params (color already as number).
 */
export function lightFromParams(params: LightParams): THREE.Light {
  switch (params.type) {
    case 'ambientLight':
      return new THREE.AmbientLight(params.color, params.intensity);
    case 'directionalLight': {
      const light = new THREE.DirectionalLight(params.color, params.intensity);
      light.castShadow = params.castShadow ?? false;
      return light;
    }
    case 'pointLight': {
      const light = new THREE.PointLight(
        params.color,
        params.intensity,
        params.distance ?? 0,
        params.decay ?? 2,
      );
      light.castShadow = params.castShadow ?? false;
      return light;
    }
    case 'spotLight': {
      const light = new THREE.SpotLight(
        params.color,
        params.intensity,
        params.distance ?? 0,
        params.angle ?? Math.PI / 3,
        params.penumbra ?? 0,
      );
      light.castShadow = params.castShadow ?? false;
      return light;
    }
  }
}
