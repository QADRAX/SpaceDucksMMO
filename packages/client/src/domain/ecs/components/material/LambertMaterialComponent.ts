import { BaseMaterialComponent } from './BaseMaterialComponent';
import type { ComponentMetadata } from '../../core/ComponentMetadata';

export class LambertMaterialComponent extends BaseMaterialComponent {
  readonly type = 'lambertMaterial';
  readonly metadata: ComponentMetadata = {
    type: 'lambertMaterial',
    unique: true,
    requires: ['geometry'],
    conflicts: ['standardMaterial', 'basicMaterial', 'phongMaterial', 'shaderMaterial'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', get: (c: LambertMaterialComponent) => c.color, set: (c, v) => { c.color = v as any; } },
        { key: 'emissive', label: 'Emissive', get: (c: LambertMaterialComponent) => c.emissive, set: (c, v) => { c.emissive = v as any; } },
        { key: 'transparent', label: 'Transparent', get: (c: LambertMaterialComponent) => c.transparent, set: (c, v) => { c.transparent = Boolean(v); } },
        { key: 'opacity', label: 'Opacity', get: (c: LambertMaterialComponent) => c.opacity, set: (c, v) => { c.opacity = Number(v); } },
      ],
    },
  };

  private _color?: string | number;
  private _emissive?: string | number;
  private _transparent?: boolean;
  private _opacity?: number;

  constructor(params: Partial<LambertMaterialComponent> = {}) {
    super();
    this._color = (params as any).color;
    this._emissive = (params as any).emissive;
    this._transparent = (params as any).transparent;
    this._opacity = (params as any).opacity;
  }

  get color() { return this._color; }
  set color(v: string | number | undefined) { this._color = v; this.notifyChanged(); }
  get emissive() { return this._emissive; }
  set emissive(v: string | number | undefined) { this._emissive = v; this.notifyChanged(); }
  get transparent() { return this._transparent; }
  set transparent(v: boolean | undefined) { this._transparent = v; this.notifyChanged(); }
  get opacity() { return this._opacity; }
  set opacity(v: number | undefined) { this._opacity = v; this.notifyChanged(); }
}

export default LambertMaterialComponent;
