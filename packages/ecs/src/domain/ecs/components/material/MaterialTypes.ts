import { Component } from "../../core/Component";
import { BasicMaterialComponent } from "./BasicMaterialComponent";
import { LambertMaterialComponent } from "./LambertMaterialComponent";
import { PhongMaterialComponent } from "./PhongMaterialComponent";
import { StandardMaterialComponent } from "./StandardMaterialComponent";

import { BasicShaderMaterialComponent } from "./shaders/BasicShaderMaterialComponent";
import { StandardShaderMaterialComponent } from "./shaders/StandardShaderMaterialComponent";
import { PhysicalShaderMaterialComponent } from "./shaders/PhysicalShaderMaterialComponent";

export type AnyMaterialComponent =
    | StandardMaterialComponent
    | BasicMaterialComponent
    | LambertMaterialComponent
    | PhongMaterialComponent;

export type AnyCustomShaderComponent =
    | BasicShaderMaterialComponent
    | StandardShaderMaterialComponent
    | PhysicalShaderMaterialComponent;

export type MaterialResourceKind = AnyMaterialComponent["type"];
export type CustomShaderResourceKind = AnyCustomShaderComponent["type"];

export const MATERIAL_RESOURCE_KINDS: MaterialResourceKind[] = [
    "basicMaterial",
    "lambertMaterial",
    "phongMaterial",
    "standardMaterial",
] as const;

export const CUSTOM_SHADER_RESOURCE_KINDS: CustomShaderResourceKind[] = [
    "basicShaderMaterial",
    "standardShaderMaterial",
    "physicalShaderMaterial"
] as const;

export const MATERIAL_RESOURCE_REF_KEY = "$resourceKey" as const;

export interface MaterialResourceRef {
    [MATERIAL_RESOURCE_REF_KEY]?: string;
}

export function isMaterialComponent(comp: Component): comp is AnyMaterialComponent {
    return (MATERIAL_RESOURCE_KINDS as string[]).includes(comp.type);
}

export function isCustomShaderComponent(comp: Component): comp is AnyCustomShaderComponent {
    return (CUSTOM_SHADER_RESOURCE_KINDS as string[]).includes(comp.type);
}
