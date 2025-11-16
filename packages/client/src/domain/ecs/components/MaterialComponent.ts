import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export type MaterialParameters =
  | {
      type: "standard";
      color?: string | number;
      metalness?: number;
      roughness?: number;
      emissive?: string | number;
      emissiveIntensity?: number;
      transparent?: boolean;
      opacity?: number;
    }
  | {
      type: "basic";
      color?: string | number;
      transparent?: boolean;
      opacity?: number;
      wireframe?: boolean;
    }
  | {
      type: "phong";
      color?: string | number;
      specular?: string | number;
      shininess?: number;
      emissive?: string | number;
      transparent?: boolean;
      opacity?: number;
    }
  | {
      type: "lambert";
      color?: string | number;
      emissive?: string | number;
      transparent?: boolean;
      opacity?: number;
    };

export class MaterialComponent extends Component {
  readonly type = "material";
  readonly metadata: ComponentMetadata = {
    type: "material",
    unique: true,
    requires: ["geometry"],
    conflicts: ["shaderMaterial"],
  };
  private _parameters: MaterialParameters;
  private _texture?: string;
  private _normalMap?: string;
  private _envMap?: string;
  constructor(parameters: MaterialParameters) {
    super();
    this._parameters = parameters;
  }
  get parameters(): MaterialParameters {
    return this._parameters;
  }
  set parameters(value: MaterialParameters) {
    this._parameters = value;
    this.notifyChanged();
  }
  get texture(): string | undefined {
    return this._texture;
  }
  set texture(v: string | undefined) {
    this._texture = v;
    this.notifyChanged();
  }
  get normalMap(): string | undefined {
    return this._normalMap;
  }
  set normalMap(v: string | undefined) {
    this._normalMap = v;
    this.notifyChanged();
  }
  get envMap(): string | undefined {
    return this._envMap;
  }
  set envMap(v: string | undefined) {
    this._envMap = v;
    this.notifyChanged();
  }
  get color(): string | number | undefined {
    return (this._parameters as any).color;
  }
  set color(v: string | number | undefined) {
    this._parameters = { ...this._parameters, color: v } as any;
    this.notifyChanged();
  }
  get opacity(): number | undefined {
    return (this._parameters as any).opacity;
  }
  set opacity(v: number | undefined) {
    this._parameters = { ...this._parameters, opacity: v } as any;
    this.notifyChanged();
  }
  get transparent(): boolean | undefined {
    return (this._parameters as any).transparent;
  }
  set transparent(v: boolean | undefined) {
    this._parameters = { ...this._parameters, transparent: v } as any;
    this.notifyChanged();
  }
}

export default MaterialComponent;
