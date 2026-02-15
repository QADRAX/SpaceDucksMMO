import { Component } from '../../core/Component';
import type { ComponentMetadata } from '../../core/ComponentMetadata';

export class TextureTilingComponent extends Component {
  readonly type = 'textureTiling';
  readonly metadata: ComponentMetadata = {
    type: 'textureTiling',
    label: 'Texture Tiling',
    description: 'Controls how textures are repeated and scaled on geometry surfaces.',
    category: 'Rendering',
    icon: 'Grid3x3',
    unique: false,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: 'repeatU',
          label: 'Repeat U',
          description: 'How many times the texture repeats horizontally (U coordinate).',
          type: 'number',
          default: 1,
          min: 0,
          step: 0.1,
          get: (c: TextureTilingComponent) => c.repeatU,
          set: (c, v) => {
            c.repeatU = v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: 'repeatV',
          label: 'Repeat V',
          description: 'How many times the texture repeats vertically (V coordinate).',
          type: 'number',
          default: 1,
          min: 0,
          step: 0.1,
          get: (c: TextureTilingComponent) => c.repeatV,
          set: (c, v) => {
            c.repeatV = v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: 'offsetU',
          label: 'Offset U',
          description: 'Horizontal offset for the texture (U coordinate).',
          type: 'number',
          default: 0,
          step: 0.01,
          get: (c: TextureTilingComponent) => c.offsetU,
          set: (c, v) => {
            c.offsetU = v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: 'offsetV',
          label: 'Offset V',
          description: 'Vertical offset for the texture (V coordinate).',
          type: 'number',
          default: 0,
          step: 0.01,
          get: (c: TextureTilingComponent) => c.offsetV,
          set: (c, v) => {
            c.offsetV = v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };

  private _repeatU?: number;
  private _repeatV?: number;
  private _offsetU?: number;
  private _offsetV?: number;

  constructor(params: Partial<TextureTilingComponent> = {}) {
    super();
    this._repeatU = (params as any).repeatU ?? 1;
    this._repeatV = (params as any).repeatV ?? 1;
    this._offsetU = (params as any).offsetU ?? 0;
    this._offsetV = (params as any).offsetV ?? 0;
  }

  validate(entity: any): string[] {
    // Require at least one material component to be present on the entity
    const has = (t: string) => entity.hasComponent && entity.hasComponent(t);
    const materialTypes = [
      'standardMaterial',
      'basicMaterial',
      'phongMaterial',
      'lambertMaterial',
      'shaderMaterial',
    ];
    const ok = materialTypes.some((t) => has(t));
    if (ok) return [];
    return [
      `Component '${this.type}' requires one of: ${materialTypes.join(
        ', '
      )}`,
    ];
  }

  get repeatU() {
    return this._repeatU;
  }
  set repeatU(v: number | undefined) {
    this._repeatU = v;
    this.notifyChanged();
  }
  get repeatV() {
    return this._repeatV;
  }
  set repeatV(v: number | undefined) {
    this._repeatV = v;
    this.notifyChanged();
  }
  get offsetU() {
    return this._offsetU;
  }
  set offsetU(v: number | undefined) {
    this._offsetU = v;
    this.notifyChanged();
  }
  get offsetV() {
    return this._offsetV;
  }
  set offsetV(v: number | undefined) {
    this._offsetV = v;
    this.notifyChanged();
  }
}

export default TextureTilingComponent;
