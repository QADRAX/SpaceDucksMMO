import { BaseCustomShaderComponent } from "./BaseCustomShaderComponent";
import type { ComponentMetadata, InspectorFieldConfig } from "../../../core/ComponentMetadata";

export class BasicShaderMaterialComponent extends BaseCustomShaderComponent {
    readonly type = "basicShaderMaterial";

    get metadata(): ComponentMetadata {
        const fields: InspectorFieldConfig[] = [
            {
                key: "shaderId",
                label: "Shader Resource",
                description: "Reference to the custom WGSL/GLSL shader resource.",
                get: (c: BasicShaderMaterialComponent) => c.shaderId,
                set: (c, v) => {
                    c.shaderId = String(v);
                },
            }
        ];

        // Generate dynamic fields for all uniforms
        for (const key of Object.keys(this.uniforms)) {
            const u = this.uniforms[key];
            const label = u.label || key
                .replace(/([A-Z])/g, ' $1')
                .replace(/[_-]/g, ' ')
                .replace(/^\w/, (c) => c.toUpperCase())
                .trim();

            const typeMapping: Record<string, InspectorFieldConfig["type"]> = {
                float: "number",
                vec2: "vector",
                vec3: "vector",
                vec4: "vector",
                color: "color",
                texture: "texture"
            };

            fields.push({
                key: `u_${key}`,
                label: label,
                type: typeMapping[u.type] || "string",
                description: u.description,
                min: u.min,
                max: u.max,
                step: u.step,
                unit: u.unit,
                get: (c: BasicShaderMaterialComponent) => c.uniforms[key].value,
                set: (c, v) => {
                    c.setUniform(key, v);
                }
            });
        }

        // Add rendering settings
        fields.push(
            {
                key: "transparent",
                label: "Transparent",
                type: "boolean",
                description: "Enables alpha blending and transparency support.",
                get: (c: BasicShaderMaterialComponent) => c.transparent,
                set: (c, v) => {
                    c.transparent = Boolean(v);
                },
            },
            {
                key: "depthWrite",
                label: "Depth Write",
                type: "boolean",
                description: "If disabled, the material won't obscure objects behind it.",
                get: (c: BasicShaderMaterialComponent) => c.depthWrite,
                set: (c, v) => {
                    c.depthWrite = Boolean(v);
                }
            },
            {
                key: "blending",
                label: "Blending",
                type: "enum",
                options: [
                    { value: "normal", label: "Normal" },
                    { value: "additive", label: "Additive" }
                ],
                description: "How colors are combined with the background.",
                get: (c: BasicShaderMaterialComponent) => c.blending,
                set: (c, v) => {
                    c.blending = String(v);
                }
            }
        );

        return {
            type: "basicShaderMaterial",
            label: "Basic Shader Material",
            description: "Applies a custom shader that is unlit (MeshBasicNodeMaterial).",
            category: "Rendering",
            icon: "Code",
            unique: true,
            requires: ["geometry"],
            conflicts: [
                "standardMaterial",
                "basicMaterial",
                "phongMaterial",
                "lambertMaterial",
                "standardShaderMaterial",
                "physicalShaderMaterial"
            ],
            inspector: {
                fields
            }
        };
    }
}
