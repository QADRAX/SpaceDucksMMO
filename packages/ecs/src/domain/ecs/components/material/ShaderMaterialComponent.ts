import { Component } from "../../core/Component";
import type { ComponentMetadata } from "../../core/ComponentMetadata";

export interface ShaderUniform {
  value: any;
  type: "float" | "vec2" | "vec3" | "vec4" | "color" | "texture";
}
export type ShaderType =
  | "atmosphere"
  | "corona"
  | "rings"
  | "nebula"
  | "custom";

export class ShaderMaterialComponent extends Component {
  readonly type = "shaderMaterial";
  readonly metadata: ComponentMetadata = {
    type: "shaderMaterial",
    unique: true,
    requires: ["geometry"],
    conflicts: [
      "standardMaterial",
      "basicMaterial",
      "phongMaterial",
      "lambertMaterial",
    ],
    inspector: {
      fields: [
        {
          key: "shaderType",
          label: "Shader",
          get: (c: ShaderMaterialComponent) => c.shaderType,
        },
        {
          key: "transparent",
          label: "Transparent",
          get: (c: ShaderMaterialComponent) => c.transparent,
          set: (c, v) => {
            c.transparent = Boolean(v);
          },
        },
        {
          key: "depthWrite",
          label: "Depth Write",
          get: (c: ShaderMaterialComponent) => c.depthWrite,
          set: (c, v) => {
            c._depthWrite = Boolean(v);
            c.notifyChanged();
          }
        },
        {
          key: "blending",
          label: "Blending",
          get: (c: ShaderMaterialComponent) => c.blending,
          set: (c, v) => {
            c._blending = String(v);
            c.notifyChanged();
          }
        },
        {
          key: "uniformKeys",
          label: "Uniforms",
          get: (c: ShaderMaterialComponent) => Object.keys(c.uniforms || {}),
          set: () => { /** read only */ },

        },
      ],
    },
  };
  private _shaderType: ShaderType;
  private _uniforms: Record<string, ShaderUniform>;
  private _vertexShader?: string;
  private _fragmentShader?: string;
  private _transparent: boolean;
  private _depthWrite: boolean;
  private _blending: string;
  constructor(params: {
    shaderType: ShaderType;
    uniforms: Record<string, ShaderUniform>;
    vertexShader?: string;
    fragmentShader?: string;
    transparent?: boolean;
    depthWrite?: boolean;
    blending?: string;
  }) {
    super();
    this._shaderType = params.shaderType;
    this._uniforms = params.uniforms;
    this._vertexShader = params.vertexShader;
    this._fragmentShader = params.fragmentShader;
    this._transparent = params.transparent ?? true;
    this._depthWrite = params.depthWrite ?? false;
    this._blending = params.blending ?? "additive";
  }
  get shaderType(): ShaderType {
    return this._shaderType;
  }
  get uniforms(): Record<string, ShaderUniform> {
    return this._uniforms;
  }
  get vertexShader(): string | undefined {
    return this._vertexShader;
  }
  get fragmentShader(): string | undefined {
    return this._fragmentShader;
  }
  get transparent(): boolean {
    return this._transparent;
  }
  set transparent(v: boolean) {
    this._transparent = v;
    this.notifyChanged();
  }
  get blending(): string {
    return this._blending;
  }
  get depthWrite(): boolean {
    return this._depthWrite;
  }
  setUniform(name: string, value: any): void {
    if (this._uniforms[name]) {
      this._uniforms[name].value = value;
      this.notifyChanged();
    }
  }
  setUniforms(uniforms: Record<string, any>): void {
    for (const [n, val] of Object.entries(uniforms))
      if (this._uniforms[n]) this._uniforms[n].value = val;
    this.notifyChanged();
  }
}

export default ShaderMaterialComponent;
