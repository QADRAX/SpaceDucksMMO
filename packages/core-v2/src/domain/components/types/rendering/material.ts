import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/** Shared fields for all material components. */
export interface MaterialComponentBase<
    TType extends 'standardMaterial' | 'basicMaterial' | 'phongMaterial' | 'lambertMaterial' = 'standardMaterial' | 'basicMaterial' | 'phongMaterial' | 'lambertMaterial',
    TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    /** Base color of the material. */
    color: string;
    /** Whether the material supports transparency. */
    transparent: boolean;
    /** Opacity level (0-1). Only used if transparent is true. */
    opacity: number;
    /** Primary albedo/diffuse texture map. */
    texture: ResourceRef<'texture'> | undefined;
}

/** PBR standard material settings. */
export interface StandardMaterialComponent extends MaterialComponentBase<'standardMaterial', StandardMaterialComponent> {
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
    /** Normal map for surface detail. */
    normalMap: ResourceRef<'texture'> | undefined;
    /** Ambient occlusion map. */
    aoMap: ResourceRef<'texture'> | undefined;
    /** Roughness map (greyscale). */
    roughnessMap: ResourceRef<'texture'> | undefined;
    /** Metalness map (greyscale). */
    metalnessMap: ResourceRef<'texture'> | undefined;
    /** Environment reflection map. */
    envMap: ResourceRef<'texture'> | undefined;
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
