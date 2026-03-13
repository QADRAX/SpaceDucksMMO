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

/** Directional light component. */
export interface DirectionalLightComponent extends LightBaseComponent<'directionalLight', DirectionalLightComponent> {
    castShadow: boolean;
}

/** Point light component. */
export interface PointLightComponent extends LightBaseComponent<'pointLight', PointLightComponent> {
    distance: number;
    decay: number;
    castShadow: boolean;
}

/** Spot light component. */
export interface SpotLightComponent extends LightBaseComponent<'spotLight', SpotLightComponent> {
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
