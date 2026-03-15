import type * as THREE from 'three';

/** Color as number (e.g. from parseColor). */
export type LightColor = number;

export interface AmbientLightParams {
  type: 'ambientLight';
  color: LightColor;
  intensity: number;
}

/** Flat shadow fields (Lua-friendly via Component.setField). */
export interface ShadowFields {
  shadowMapSize?: number;
  shadowBias?: number;
  shadowNormalBias?: number;
  shadowCameraLeft?: number;
  shadowCameraRight?: number;
  shadowCameraTop?: number;
  shadowCameraBottom?: number;
  shadowCameraNear?: number;
  shadowCameraFar?: number;
}

export interface DirectionalLightParams extends ShadowFields {
  type: 'directionalLight';
  color: LightColor;
  intensity: number;
  castShadow: boolean;
}

export interface PointLightParams extends ShadowFields {
  type: 'pointLight';
  color: LightColor;
  intensity: number;
  distance: number;
  decay: number;
  castShadow: boolean;
}

export interface SpotLightParams extends ShadowFields {
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
 * @param params - Light parameters from ECS component.
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function lightFromParams(
  params: LightParams,
  three: typeof import('three'),
): THREE.Light {
  switch (params.type) {
    case 'ambientLight':
      return new three.AmbientLight(params.color, params.intensity);
    case 'directionalLight': {
      const light = new three.DirectionalLight(params.color, params.intensity);
      light.castShadow = params.castShadow ?? false;
      if (light.castShadow) {
        const mapSize = params.shadowMapSize ?? 2048;
        light.shadow.mapSize.width = mapSize;
        light.shadow.mapSize.height = mapSize;
        light.shadow.camera.near = params.shadowCameraNear ?? 0.5;
        light.shadow.camera.far = params.shadowCameraFar ?? 150;
        light.shadow.camera.left = params.shadowCameraLeft ?? -20;
        light.shadow.camera.right = params.shadowCameraRight ?? 20;
        light.shadow.camera.top = params.shadowCameraTop ?? 20;
        light.shadow.camera.bottom = params.shadowCameraBottom ?? -20;
        light.shadow.bias = params.shadowBias ?? -0.00001;
        light.shadow.normalBias = params.shadowNormalBias ?? 0.01;
        light.shadow.camera.updateProjectionMatrix();
      }
      return light;
    }
    case 'pointLight': {
      const light = new three.PointLight(
        params.color,
        params.intensity,
        params.distance ?? 0,
        params.decay ?? 2,
      );
      light.castShadow = params.castShadow ?? false;
      if (light.castShadow) {
        const mapSize = params.shadowMapSize ?? 512;
        light.shadow.mapSize.width = mapSize;
        light.shadow.mapSize.height = mapSize;
        light.shadow.bias = params.shadowBias ?? -0.001;
        if (params.shadowNormalBias != null) light.shadow.normalBias = params.shadowNormalBias;
      }
      return light;
    }
    case 'spotLight': {
      const light = new three.SpotLight(
        params.color,
        params.intensity,
        params.distance ?? 0,
        params.angle ?? Math.PI / 3,
        params.penumbra ?? 0,
      );
      light.castShadow = params.castShadow ?? false;
      if (light.castShadow) {
        const mapSize = params.shadowMapSize ?? 512;
        light.shadow.mapSize.width = mapSize;
        light.shadow.mapSize.height = mapSize;
        light.shadow.bias = params.shadowBias ?? -0.001;
        if (params.shadowNormalBias != null) light.shadow.normalBias = params.shadowNormalBias;
      }
      return light;
    }
  }
}
