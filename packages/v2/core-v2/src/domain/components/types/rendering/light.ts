import type { ComponentBase } from '../core';

/** Shared light parameters. */
export interface LightBaseComponent<
    TType extends 'ambientLight' | 'directionalLight' | 'pointLight' | 'spotLight' = 'ambientLight' | 'directionalLight' | 'pointLight' | 'spotLight',
    TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    color: string;
    intensity: number;
}

/** Ambient light component. */
export interface AmbientLightComponent extends LightBaseComponent<'ambientLight', AmbientLightComponent> { }

/** Flat shadow fields for Lua/Component.setField support. Optional; defaults applied in rendering. */
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

/** Directional light component. */
export interface DirectionalLightComponent extends LightBaseComponent<'directionalLight', DirectionalLightComponent>, ShadowFields {
    castShadow: boolean;
}

/** Point light component. */
export interface PointLightComponent extends LightBaseComponent<'pointLight', PointLightComponent>, ShadowFields {
    distance: number;
    decay: number;
    castShadow: boolean;
}

/** Spot light component. */
export interface SpotLightComponent extends LightBaseComponent<'spotLight', SpotLightComponent>, ShadowFields {
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
