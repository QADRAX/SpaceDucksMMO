import { BaseMaterialComponent } from "./BaseMaterialComponent";
import type { ComponentMetadata, InspectorFieldConfig } from "../../core/ComponentMetadata";

export interface ShaderUniform {
  value: any;
  type: "float" | "vec2" | "vec3" | "vec4" | "color" | "texture";
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export class ShaderMaterialComponent extends BaseMaterialComponent {
  readonly type = "shaderMaterial";

  get metadata(): ComponentMetadata {
    const fields: InspectorFieldConfig[] = [
      {
        key: "shaderId",
        label: "Shader Resource",
        description: "Reference to the custom WGSL/GLSL shader resource.",
        get: (c: ShaderMaterialComponent) => c.shaderId,
        set: (c, v) => {
          c.shaderId = String(v);
        },
      }
    ];

    // Generate dynamic fields for all uniforms
    for (const key of Object.keys(this._uniforms)) {
      const u = this._uniforms[key];
      // Convert camelCase or snake_case to Title Case Label
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
        get: (c: ShaderMaterialComponent) => c.uniforms[key].value,
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
        description: "Whether the material supports transparency.",
        get: (c: ShaderMaterialComponent) => c.transparent,
        set: (c, v) => {
          c.transparent = Boolean(v);
        },
      },
      {
        key: "depthWrite",
        label: "Depth Write",
        type: "boolean",
        description: "Whether the material writes to the depth buffer.",
        get: (c: ShaderMaterialComponent) => c.depthWrite,
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
        description: "Blending mode for transparency.",
        get: (c: ShaderMaterialComponent) => c.blending,
        set: (c, v) => {
          c.blending = String(v);
        }
      }
    );

    return {
      type: "shaderMaterial",
      label: "Shader Material",
      description: "Applies a custom shader with parametric uniforms.",
      category: "Rendering",
      icon: "Code",
      unique: true,
      requires: ["geometry"],
      conflicts: [
        "standardMaterial",
        "basicMaterial",
        "phongMaterial",
        "lambertMaterial",
      ],
      inspector: {
        fields
      }
    };
  }

  private _shaderId: string;
  private _uniforms: Record<string, ShaderUniform>;
  private _transparent: boolean;
  private _depthWrite: boolean;
  private _blending: string;

  constructor(params: {
    shaderId: string;
    uniforms?: Record<string, ShaderUniform>;
    transparent?: boolean;
    depthWrite?: boolean;
    blending?: string;
  }) {
    super();
    this._shaderId = params.shaderId;
    this._uniforms = params.uniforms ?? {};
    this._transparent = params.transparent ?? true;
    this._depthWrite = params.depthWrite ?? false;
    this._blending = params.blending ?? "normal";
  }

  get shaderId(): string {
    return this._shaderId;
  }

  set shaderId(v: string) {
    this._shaderId = v;
    this.notifyChanged();
  }

  get uniforms(): Record<string, ShaderUniform> {
    return this._uniforms;
  }

  set uniforms(u: Record<string, ShaderUniform>) {
    this._uniforms = u;
    this.notifyChanged();
  }

  get transparent(): boolean {
    return this._transparent;
  }

  set transparent(v: boolean) {
    this._transparent = v;
    this.notifyChanged();
  }

  get depthWrite(): boolean {
    return this._depthWrite;
  }

  set depthWrite(v: boolean) {
    this._depthWrite = v;
    this.notifyChanged();
  }

  get blending(): string {
    return this._blending;
  }

  set blending(v: string) {
    this._blending = v;
    this.notifyChanged();
  }

  setUniform(name: string, value: any, type?: ShaderUniform["type"]): void {
    if (this._uniforms[name]) {
      this._uniforms[name].value = value;
      if (type) this._uniforms[name].type = type;
      this.notifyChanged();
    } else {
      this._uniforms[name] = {
        value,
        type: type ?? "float"
      };
      this.notifyChanged();
    }
  }

  setUniforms(uniforms: Record<string, any>): void {
    let changed = false;
    for (const [n, val] of Object.entries(uniforms)) {
      const isObject = val && typeof val === 'object' && 'value' in val;
      const finalValue = isObject ? (val as any).value : val;
      const finalType = isObject ? (val as any).type : undefined;

      if (this._uniforms[n]) {
        this._uniforms[n].value = finalValue;
        if (finalType) this._uniforms[n].type = finalType;
        changed = true;
      } else {
        this._uniforms[n] = {
          value: finalValue,
          type: finalType ?? "float"
        };
        changed = true;
      }
    }
    if (changed) this.notifyChanged();
  }
}

export default ShaderMaterialComponent;
