import { BaseCustomShaderComponent, ShaderUniform } from "./BaseCustomShaderComponent";
import type { ComponentMetadata, InspectorFieldConfig } from "../../../core/ComponentMetadata";

export class PhysicalShaderMaterialComponent extends BaseCustomShaderComponent {
    readonly type = "physicalShaderMaterial";

    private _roughness: number;
    private _metalness: number;
    private _clearcoat: number;
    private _transmission: number;
    private _ior: number;
    private _thickness: number;

    constructor(params: {
        shaderId: string;
        uniforms?: Record<string, ShaderUniform>;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: string;
        roughness?: number;
        metalness?: number;
        clearcoat?: number;
        transmission?: number;
        ior?: number;
        thickness?: number;
    }) {
        super(params);
        this._roughness = params.roughness ?? 0.5;
        this._metalness = params.metalness ?? 0.0;
        this._clearcoat = params.clearcoat ?? 0.0;
        this._transmission = params.transmission ?? 0.0;
        this._ior = params.ior ?? 1.5;
        this._thickness = params.thickness ?? 0.0;
    }

    get roughness(): number { return this._roughness; }
    set roughness(v: number) { this._roughness = v; this.notifyChanged(); }

    get metalness(): number { return this._metalness; }
    set metalness(v: number) { this._metalness = v; this.notifyChanged(); }

    get clearcoat(): number { return this._clearcoat; }
    set clearcoat(v: number) { this._clearcoat = v; this.notifyChanged(); }

    get transmission(): number { return this._transmission; }
    set transmission(v: number) { this._transmission = v; this.notifyChanged(); }

    get ior(): number { return this._ior; }
    set ior(v: number) { this._ior = v; this.notifyChanged(); }

    get thickness(): number { return this._thickness; }
    set thickness(v: number) { this._thickness = v; this.notifyChanged(); }

    get metadata(): ComponentMetadata {
        const fields: InspectorFieldConfig[] = [
            {
                key: "shaderId",
                label: "Shader Resource",
                description: "Reference to the custom WGSL/GLSL shader resource.",
                get: (c: PhysicalShaderMaterialComponent) => c.shaderId,
                set: (c, v) => { c.shaderId = String(v); },
            }
        ];

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
                get: (c: PhysicalShaderMaterialComponent) => c.uniforms[key].value,
                set: (c, v) => { c.setUniform(key, v); }
            });
        }

        fields.push(
            {
                key: "roughness",
                label: "Roughness",
                type: "number",
                min: 0,
                max: 1,
                step: 0.01,
                description: "Surface roughness from 0 (mirror-like) to 1 (diffuse).",
                get: (c: PhysicalShaderMaterialComponent) => c.roughness,
                set: (c, v) => { c.roughness = Number(v); }
            },
            {
                key: "metalness",
                label: "Metalness",
                type: "number",
                min: 0,
                max: 1,
                step: 0.01,
                description: "Metal-like reflectivity from 0 (non-metal) to 1 (pure metal).",
                get: (c: PhysicalShaderMaterialComponent) => c.metalness,
                set: (c, v) => { c.metalness = Number(v); }
            },
            {
                key: "clearcoat",
                label: "Clearcoat",
                type: "number",
                min: 0,
                // Remove max as requested by user ("no tiene maximo")
                step: 0.01,
                description: "Intensity of the clearcoat layer, like a varnish or lacquer.",
                get: (c: PhysicalShaderMaterialComponent) => c.clearcoat,
                set: (c, v) => { c.clearcoat = Number(v); }
            },
            {
                key: "transmission",
                label: "Transmission",
                type: "number",
                min: 0,
                max: 1,
                step: 0.01,
                description: "Degree of light transmission through the material (glass-like).",
                get: (c: PhysicalShaderMaterialComponent) => c.transmission,
                set: (c, v) => { c.transmission = Number(v); }
            },
            {
                key: "ior",
                label: "IOR",
                type: "number",
                min: 1,
                max: 2.333,
                step: 0.01,
                description: "Index of Refraction. Defines how light bends (e.g., 1.5 for glass, 1.3 for water).",
                get: (c: PhysicalShaderMaterialComponent) => c.ior,
                set: (c, v) => { c.ior = Number(v); }
            },
            {
                key: "thickness",
                label: "Thickness",
                type: "number",
                min: 0,
                // Increase/remove max for thickness
                step: 0.1,
                unit: "m",
                description: "Thickness of the volume below the surface. Affects transmission and refraction.",
                get: (c: PhysicalShaderMaterialComponent) => c.thickness,
                set: (c, v) => { c.thickness = Number(v); }
            },
            {
                key: "transparent",
                label: "Transparent",
                type: "boolean",
                description: "Enables alpha blending and transparency support.",
                get: (c: PhysicalShaderMaterialComponent) => c.transparent,
                set: (c, v) => { c.transparent = Boolean(v); },
            },
            {
                key: "depthWrite",
                label: "Depth Write",
                type: "boolean",
                description: "If disabled, the material won't obscure objects behind it.",
                get: (c: PhysicalShaderMaterialComponent) => c.depthWrite,
                set: (c, v) => { c.depthWrite = Boolean(v); }
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
                get: (c: PhysicalShaderMaterialComponent) => c.blending,
                set: (c, v) => { c.blending = String(v); }
            }
        );

        return {
            type: "physicalShaderMaterial",
            label: "Physical Shader Material",
            description: "Advanced shader material with optical properties like transmission and clearcoat.",
            category: "Rendering",
            icon: "Code",
            unique: true,
            requires: ["geometry"],
            conflicts: [
                "standardMaterial",
                "basicMaterial",
                "phongMaterial",
                "lambertMaterial",
                "basicShaderMaterial",
                "standardShaderMaterial"
            ],
            inspector: {
                fields
            }
        };
    }
}
