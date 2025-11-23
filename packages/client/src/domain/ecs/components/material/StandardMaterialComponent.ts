import { BaseMaterialComponent } from './BaseMaterialComponent';
import type { ComponentMetadata } from '../../core/ComponentMetadata';

export class StandardMaterialComponent extends BaseMaterialComponent {
  readonly type = "standardMaterial";
  readonly metadata: ComponentMetadata = {
    type: "standardMaterial",
    description: "Material físico PBR estándar de Three.js. Permite simular superficies realistas con parámetros como color, metalicidad, rugosidad, emisión, transparencia y texturas. Se mapea directamente a THREE.MeshStandardMaterial.",
    unique: true,
    requires: ["geometry"],
    conflicts: [
      "basicMaterial",
      "phongMaterial",
      "lambertMaterial",
      "shaderMaterial",
    ],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
          type: "color",
          description: "Color base del material. Es el color principal que ves en el objeto si no hay textura. Se asigna a THREE.MeshStandardMaterial.color.",
          get: (c: StandardMaterialComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "metalness",
          label: "Metalness",
          type: "number",
          nullable: true,
          default: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          description: "¿Cuánto parece metal la superficie? 0 = plástico/madera, 1 = metal puro. Se asigna a THREE.MeshStandardMaterial.metalness.",
          get: (c: StandardMaterialComponent) => c.metalness,
          set: (c, v) => {
            c.metalness = v ? Number(v) : undefined;
          },
        },
        {
          key: "roughness",
          label: "Roughness",
          type: "number",
          nullable: true,
          default: 0.5,
          min: 0,
          max: 1,
          step: 0.01,
          description: "¿La superficie es lisa o rugosa? 0 = espejo, 1 = muy rugoso. Se asigna a THREE.MeshStandardMaterial.roughness.",
          get: (c: StandardMaterialComponent) => c.roughness,
          set: (c, v) => {
            c.roughness = v ? Number(v) : undefined;
          },
        },
        {
          key: "emissive",
          label: "Emissive",
          type: "color",
          default: "#d8d8d8ff",
          nullable: true,
          description: "Color de luz que el material emite por sí mismo, como si brillara en la oscuridad. No ilumina otros objetos. Se asigna a THREE.MeshStandardMaterial.emissive.",
          get: (c: StandardMaterialComponent) => c.emissive,
          set: (c, v) => {
            c.emissive = v as any;
          },
        },
        {
          key: "emissiveIntensity",
          label: "Emissive Intensity",
          type: "number",
          nullable: true,
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          description: "Multiplica el color de emisión. 0 = no emite luz, 1 = emite el color tal cual, >1 = más brillante. Se asigna a THREE.MeshStandardMaterial.emissiveIntensity.",
          get: (c: StandardMaterialComponent) => c.emissiveIntensity,
          set: (c, v) => {
            c.emissiveIntensity = v ? Number(v) : undefined;
          },
        },
        {
          key: "transparent",
          label: "Transparent",
          type: "boolean",
          nullable: false,
          description: "Permite que el material sea transparente. Si está activado, la opacidad afecta la visibilidad. Se asigna a THREE.MeshStandardMaterial.transparent.",
          get: (c: StandardMaterialComponent) => c.transparent,
          set: (c, v) => {
            c.transparent = Boolean(v);
          },
        },
        {
          key: "opacity",
          label: "Opacity",
          type: "number",
          nullable: true,
          default: 1,
          min: 0,
          max: 1,
          step: 0.01,
          description: "Controla cuán transparente es el material. 1 = opaco, 0 = invisible. Solo funciona si 'Transparent' está activado. Se asigna a THREE.MeshStandardMaterial.opacity.",
          get: (c: StandardMaterialComponent) => c.opacity,
          set: (c, v) => {
            c.opacity = v ? Number(v) : undefined;
          },
        },
        {
          key: "texture",
          label: "Texture",
          type: "texture",
          nullable: true,
          description: "ID del catálogo de texturas (ej. 'planets/moon'). Si se asigna, reemplaza el color base. El renderer resuelve el id a una ruta de asset.",
          get: (c: StandardMaterialComponent) => c.texture,
          set: (c, v) => {
            c.texture = v as any;
          },
        },
        {
          key: "normalMap",
          label: "Normal Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para un mapa normal. Mejora el relieve visual sin cambiar la geometría. El renderer resolverá el id.",
          get: (c: StandardMaterialComponent) => c.normalMap,
          set: (c, v) => {
            c.normalMap = v as any;
          },
        },
        {
          key: "envMap",
          label: "Env Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para environment map (reflejos). Usado para simular reflejos del entorno. El renderer elegirá el asset apropiado.",
          get: (c: StandardMaterialComponent) => c.envMap,
          set: (c, v) => {
            c.envMap = v as any;
          },
        },
      ],
    },
  };

  private _color?: string | number;
  private _metalness?: number;
  private _roughness?: number;
  private _emissive?: string | number;
  private _emissiveIntensity?: number;
  private _transparent?: boolean;
  private _opacity?: number;
  private _texture?: string;
  private _normalMap?: string;
  private _envMap?: string;

  constructor(params: Partial<StandardMaterialComponent> = {}) {
    super();
    this._color = (params as any).color;
    this._metalness = (params as any).metalness;
    this._roughness = (params as any).roughness;
    this._emissive = (params as any).emissive;
    this._emissiveIntensity = (params as any).emissiveIntensity;
    this._transparent = (params as any).transparent;
    this._opacity = (params as any).opacity;
    this._texture = (params as any).texture;
    this._normalMap = (params as any).normalMap;
    this._envMap = (params as any).envMap;
  }

  get color() {
    return this._color;
  }
  set color(v: string | number | undefined) {
    this._color = v;
    this.notifyChanged();
  }
  get metalness() {
    return this._metalness;
  }
  set metalness(v: number | undefined) {
    this._metalness = v;
    this.notifyChanged();
  }
  get roughness() {
    return this._roughness;
  }
  set roughness(v: number | undefined) {
    this._roughness = v;
    this.notifyChanged();
  }
  get emissive() {
    return this._emissive;
  }
  set emissive(v: string | number | undefined) {
    this._emissive = v;
    this.notifyChanged();
  }
  get emissiveIntensity() {
    return this._emissiveIntensity;
  }
  set emissiveIntensity(v: number | undefined) {
    this._emissiveIntensity = v;
    this.notifyChanged();
  }
  get transparent() {
    return this._transparent;
  }
  set transparent(v: boolean | undefined) {
    this._transparent = v;
    this.notifyChanged();
  }
  get opacity() {
    return this._opacity;
  }
  set opacity(v: number | undefined) {
    this._opacity = v;
    this.notifyChanged();
  }
  get texture() {
    return this._texture;
  }
  set texture(v: string | undefined) {
    this._texture = v;
    this.notifyChanged();
  }
  get normalMap() {
    return this._normalMap;
  }
  set normalMap(v: string | undefined) {
    this._normalMap = v;
    this.notifyChanged();
  }
  get envMap() {
    return this._envMap;
  }
  set envMap(v: string | undefined) {
    this._envMap = v;
    this.notifyChanged();
  }
}

export default StandardMaterialComponent;
