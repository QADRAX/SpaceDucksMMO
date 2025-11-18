import { BaseMaterialComponent } from './BaseMaterialComponent';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export class PhongMaterialComponent extends BaseMaterialComponent {
  readonly type = 'phongMaterial';
  readonly metadata: ComponentMetadata = {
    type: 'phongMaterial',
    unique: true,
    requires: ['geometry'],
    conflicts: ['standardMaterial', 'basicMaterial', 'lambertMaterial', 'shaderMaterial'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', get: (c: PhongMaterialComponent) => c.color, set: (c, v) => { c.color = v as any; } },
        { key: 'specular', label: 'Specular', get: (c: PhongMaterialComponent) => c.specular, set: (c, v) => { c.specular = v as any; } },
        { key: 'shininess', label: 'Shininess', get: (c: PhongMaterialComponent) => c.shininess, set: (c, v) => { c.shininess = Number(v); } },
        { key: 'emissive', label: 'Emissive', get: (c: PhongMaterialComponent) => c.emissive, set: (c, v) => { c.emissive = v as any; } },
        { key: 'transparent', label: 'Transparent', get: (c: PhongMaterialComponent) => c.transparent, set: (c, v) => { c.transparent = Boolean(v); } },
        { key: 'opacity', label: 'Opacity', get: (c: PhongMaterialComponent) => c.opacity, set: (c, v) => { c.opacity = Number(v); } },
      ],
    },
  };

  private _color?: string | number;
  private _specular?: string | number;
  private _shininess?: number;
  private _emissive?: string | number;
  private _transparent?: boolean;
  private _opacity?: number;

  constructor(params: Partial<PhongMaterialComponent> = {}) {
    super();
    this._color = (params as any).color;
    this._specular = (params as any).specular;
    this._shininess = (params as any).shininess;
    this._emissive = (params as any).emissive;
    this._transparent = (params as any).transparent;
    this._opacity = (params as any).opacity;
  }

  get color() { return this._color; }
  set color(v: string | number | undefined) { this._color = v; this.notifyChanged(); }
  get specular() { return this._specular; }
  set specular(v: string | number | undefined) { this._specular = v; this.notifyChanged(); }
  get shininess() { return this._shininess; }
  set shininess(v: number | undefined) { this._shininess = v; this.notifyChanged(); }
  get emissive() { return this._emissive; }
  set emissive(v: string | number | undefined) { this._emissive = v; this.notifyChanged(); }
  get transparent() { return this._transparent; }
  set transparent(v: boolean | undefined) { this._transparent = v; this.notifyChanged(); }
  get opacity() { return this._opacity; }
  set opacity(v: number | undefined) { this._opacity = v; this.notifyChanged(); }
}

export default PhongMaterialComponent;
