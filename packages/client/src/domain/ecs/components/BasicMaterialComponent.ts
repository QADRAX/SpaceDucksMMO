import { BaseMaterialComponent } from './BaseMaterialComponent';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export class BasicMaterialComponent extends BaseMaterialComponent {
  readonly type = 'basicMaterial';
  readonly metadata: ComponentMetadata = {
    type: 'basicMaterial',
    unique: true,
    requires: ['geometry'],
    conflicts: ['standardMaterial', 'phongMaterial', 'lambertMaterial', 'shaderMaterial'],
    inspector: {
      fields: [
        { key: 'color', label: 'Color', get: (c: BasicMaterialComponent) => c.color, set: (c, v) => { c.color = v as any; } },
        { key: 'transparent', label: 'Transparent', get: (c: BasicMaterialComponent) => c.transparent, set: (c, v) => { c.transparent = Boolean(v); } },
        { key: 'opacity', label: 'Opacity', get: (c: BasicMaterialComponent) => c.opacity, set: (c, v) => { c.opacity = Number(v); } },
        { key: 'wireframe', label: 'Wireframe', get: (c: BasicMaterialComponent) => c.wireframe, set: (c, v) => { c.wireframe = Boolean(v); } },
        { key: 'texture', label: 'Texture', get: (c: BasicMaterialComponent) => c.texture, set: (c, v) => { c.texture = v as any; } },
        { key: 'normalMap', label: 'Normal Map', get: (c: BasicMaterialComponent) => c.normalMap, set: (c, v) => { c.normalMap = v as any; } },
        { key: 'envMap', label: 'Env Map', get: (c: BasicMaterialComponent) => c.envMap, set: (c, v) => { c.envMap = v as any; } },
      ],
    },
  };

  private _color?: string | number;
  private _transparent?: boolean;
  private _opacity?: number;
  private _wireframe?: boolean;
  private _texture?: string;
  private _normalMap?: string;
  private _envMap?: string;

  constructor(params: Partial<BasicMaterialComponent> = {}) {
    super();
    this._color = (params as any).color;
    this._transparent = (params as any).transparent;
    this._opacity = (params as any).opacity;
    this._wireframe = (params as any).wireframe;
    this._texture = (params as any).texture;
    this._normalMap = (params as any).normalMap;
    this._envMap = (params as any).envMap;
  }

  get color() { return this._color; }
  set color(v: string | number | undefined) { this._color = v; this.notifyChanged(); }
  get transparent() { return this._transparent; }
  set transparent(v: boolean | undefined) { this._transparent = v; this.notifyChanged(); }
  get opacity() { return this._opacity; }
  set opacity(v: number | undefined) { this._opacity = v; this.notifyChanged(); }
  get wireframe() { return this._wireframe; }
  set wireframe(v: boolean | undefined) { this._wireframe = v; this.notifyChanged(); }
  get texture() { return this._texture; }
  set texture(v: string | undefined) { this._texture = v; this.notifyChanged(); }
  get normalMap() { return this._normalMap; }
  set normalMap(v: string | undefined) { this._normalMap = v; this.notifyChanged(); }
  get envMap() { return this._envMap; }
  set envMap(v: string | undefined) { this._envMap = v; this.notifyChanged(); }
}

export default BasicMaterialComponent;
