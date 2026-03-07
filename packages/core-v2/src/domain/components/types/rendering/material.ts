import type { ComponentBase } from '../core';

/** Shared fields for all material components. */
export interface MaterialComponentBase extends ComponentBase {
    color: string;
    transparent: boolean;
    opacity: number;
    texture: string | undefined;
}

/** PBR standard material settings. */
export interface StandardMaterialComponent extends MaterialComponentBase {
    type: 'standardMaterial';
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
}

/** Unlit basic material settings. */
export interface BasicMaterialComponent extends MaterialComponentBase {
    type: 'basicMaterial';
    wireframe: boolean;
}

/** Phong material settings. */
export interface PhongMaterialComponent extends MaterialComponentBase {
    type: 'phongMaterial';
    specular: string;
    shininess: number;
    emissive: string;
}

/** Lambert material settings. */
export interface LambertMaterialComponent extends MaterialComponentBase {
    type: 'lambertMaterial';
    emissive: string;
}

/** Union of all material components. */
export type MaterialComponent =
    | StandardMaterialComponent
    | BasicMaterialComponent
    | PhongMaterialComponent
    | LambertMaterialComponent;
