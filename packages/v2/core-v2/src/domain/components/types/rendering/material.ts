import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/** Literal union of plain (built-in) material component type strings. */
export type PlainMaterialComponentType =
  | 'standardMaterial'
  | 'basicMaterial'
  | 'phongMaterial'
  | 'lambertMaterial';

/** Shared fields for all material components. */
export interface MaterialComponentBase<
  TType extends PlainMaterialComponentType = PlainMaterialComponentType,
  TResourceKind extends TType = TType,
  TSelf = unknown,
> extends ComponentBase<TType, TSelf> {
    /** 
     * Blueprint material resource.
     * If provided, its scalar data and files act as the base for this component.
     */
    material: ResourceRef<TResourceKind> | undefined;

    // -- Overrides: These values take precedence over the blueprint --
    /** Base color override. */
    color: string | undefined;
    /** Whether the material supports transparency. */
    transparent: boolean | undefined;
    /** Opacity level (0-1). Only used if transparent is true. */
    opacity: number | undefined;

    /** Primary albedo/diffuse texture map override. */
    albedo: ResourceRef<'texture'> | undefined;
}

/** PBR standard material settings. */
export interface StandardMaterialComponent extends MaterialComponentBase<'standardMaterial', 'standardMaterial', StandardMaterialComponent> {
    metalness: number | undefined;
    roughness: number | undefined;
    emissive: string | undefined;
    emissiveIntensity: number | undefined;

    // -- Texture Overrides --
    /** Normal map for surface detail override. */
    normalMap: ResourceRef<'texture'> | undefined;
    /** Ambient occlusion map override. */
    aoMap: ResourceRef<'texture'> | undefined;
    /** Roughness map (greyscale) override. */
    roughnessMap: ResourceRef<'texture'> | undefined;
    /** Metallic map (greyscale) override. */
    metallicMap: ResourceRef<'texture'> | undefined;
    /** Environment reflection map override. */
    envMap: ResourceRef<'texture'> | undefined;
}

/** Unlit basic material settings. */
export interface BasicMaterialComponent extends MaterialComponentBase<'basicMaterial', 'basicMaterial', BasicMaterialComponent> {
    wireframe: boolean | undefined;
}

/** Phong material settings. */
export interface PhongMaterialComponent extends MaterialComponentBase<'phongMaterial', 'phongMaterial', PhongMaterialComponent> {
    specular: string | undefined;
    shininess: number | undefined;
    emissive: string | undefined;
}

/** Lambert material settings. */
export interface LambertMaterialComponent extends MaterialComponentBase<'lambertMaterial', 'lambertMaterial', LambertMaterialComponent> {
    emissive: string | undefined;
}

/** Union of all material components. */
export type MaterialComponent =
    | StandardMaterialComponent
    | BasicMaterialComponent
    | PhongMaterialComponent
    | LambertMaterialComponent;

/**
 * Returns all texture refs from a material component.
 * Each material type has a different set of slots; this collects them in a type-safe way.
 */
export function getMaterialTextureRefs(mat: MaterialComponent): ResourceRef<'texture'>[] {
    const refs: ResourceRef<'texture'>[] = [];
    if (mat.albedo) refs.push(mat.albedo);
    if ('normalMap' in mat && mat.normalMap) refs.push(mat.normalMap);
    if ('aoMap' in mat && mat.aoMap) refs.push(mat.aoMap);
    if ('roughnessMap' in mat && mat.roughnessMap) refs.push(mat.roughnessMap);
    if ('metallicMap' in mat && mat.metallicMap) refs.push(mat.metallicMap);
    if ('envMap' in mat && mat.envMap) refs.push(mat.envMap);
    return refs;
}
