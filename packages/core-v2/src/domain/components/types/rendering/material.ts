import type { ComponentBase } from '../core';

/** Shared fields for all material components. */
export interface MaterialComponentBase<
    TType extends 'standardMaterial' | 'basicMaterial' | 'phongMaterial' | 'lambertMaterial' = 'standardMaterial' | 'basicMaterial' | 'phongMaterial' | 'lambertMaterial',
    TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    color: string;
    transparent: boolean;
    opacity: number;
    texture: string | undefined;
}

/** PBR standard material settings. */
export interface StandardMaterialComponent extends MaterialComponentBase<'standardMaterial', StandardMaterialComponent> {
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
}

/** Unlit basic material settings. */
export interface BasicMaterialComponent extends MaterialComponentBase<'basicMaterial', BasicMaterialComponent> {
    wireframe: boolean;
}

/** Phong material settings. */
export interface PhongMaterialComponent extends MaterialComponentBase<'phongMaterial', PhongMaterialComponent> {
    specular: string;
    shininess: number;
    emissive: string;
}

/** Lambert material settings. */
export interface LambertMaterialComponent extends MaterialComponentBase<'lambertMaterial', LambertMaterialComponent> {
    emissive: string;
}

/** Union of all material components. */
export type MaterialComponent =
    | StandardMaterialComponent
    | BasicMaterialComponent
    | PhongMaterialComponent
    | LambertMaterialComponent;
