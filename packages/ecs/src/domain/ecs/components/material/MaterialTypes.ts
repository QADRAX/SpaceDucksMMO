import { Component } from "../../core/Component";
import { BasicMaterialComponent } from "./BasicMaterialComponent";
import { LambertMaterialComponent } from "./LambertMaterialComponent";
import { PhongMaterialComponent } from "./PhongMaterialComponent";
import { StandardMaterialComponent } from "./StandardMaterialComponent";

export type AnyMaterialComponent =
    | StandardMaterialComponent
    | BasicMaterialComponent
    | LambertMaterialComponent
    | PhongMaterialComponent;

export type MaterialResourceKind = AnyMaterialComponent["type"];

export const MATERIAL_RESOURCE_KINDS: MaterialResourceKind[] = [
    "basicMaterial",
    "lambertMaterial",
    "phongMaterial",
    "standardMaterial",
] as const;

export const MATERIAL_RESOURCE_REF_KEY = "$resourceKey" as const;

export interface MaterialResourceRef {
    [MATERIAL_RESOURCE_REF_KEY]?: string;
}

export function isMaterialComponent(comp: Component): comp is AnyMaterialComponent {
    return (MATERIAL_RESOURCE_KINDS as string[]).includes(comp.type);
}
