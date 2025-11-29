import { BaseMaterialComponent } from "./BaseMaterialComponent";
import type { ComponentMetadata } from "../../core/ComponentMetadata";

export class PhongMaterialComponent extends BaseMaterialComponent {
  readonly type = "phongMaterial";
  readonly metadata: ComponentMetadata = {
    type: "phongMaterial",
    description:
      "Material con specular y brillo (Phong). Ideal para superficies brillantes y efectos de iluminación local. Se mapea a THREE.MeshPhongMaterial.",
    unique: true,
    requires: ["geometry"],
    conflicts: [
      "standardMaterial",
      "basicMaterial",
      "lambertMaterial",
      "shaderMaterial",
    ],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
          type: "color",
          description: "Color base del material (diffuse).",
          get: (c: PhongMaterialComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "specular",
          label: "Specular",
          type: "color",
          description: "Color de las reflexiones especulares (brillo). Afecta el color de los highlights.",
          get: (c: PhongMaterialComponent) => c.specular,
          set: (c, v) => {
            c.specular = v as any;
          },
        },
        {
          key: "shininess",
          label: "Shininess",
          type: "number",
          nullable: true,
          default: 30,
          min: 0,
          max: 100,
          step: 1,
          description:
            "Cuánto se concentra el brillo especular: valores altos generan highlights pequeños y duros.",
          get: (c: PhongMaterialComponent) => c.shininess,
          set: (c, v) => {
            c.shininess = Number(v);
          },
        },
        {
          key: "emissive",
          label: "Emissive",
          type: "color",
          description: "Color que el material parece emitir por sí mismo (no ilumina otros objetos).",
          get: (c: PhongMaterialComponent) => c.emissive,
          set: (c, v) => {
            c.emissive = v as any;
          },
        },
        {
          key: "transparent",
          label: "Transparent",
          type: "boolean",
          description: "Permite la transparencia y uso de 'Opacity'.",
          get: (c: PhongMaterialComponent) => c.transparent,
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
          description: "Opacidad del material cuando 'Transparent' está activado.",
          get: (c: PhongMaterialComponent) => c.opacity,
          set: (c, v) => {
            c.opacity = Number(v);
          },
        },
        {
          key: "texture",
          label: "Texture",
          type: "texture",
          nullable: true,
          description: "ID del catálogo de texturas (ej. 'planets/moon'). El renderer resolverá el id a la ruta del asset en tiempo de renderizado.",
          get: (c: PhongMaterialComponent) => c.texture,
          set: (c, v) => {
            c.texture = v as any;
          },
        },
        {
          key: "normalMap",
          label: "Normal Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para mapa normal. Mejora el relieve visual sin cambiar la geometría.",
          get: (c: PhongMaterialComponent) => c.normalMap,
          set: (c, v) => {
            c.normalMap = v as any;
          },
        },
        {
          key: "specularMap",
          label: "Specular Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para specularMap. Controla dónde aparecen reflexiones/specular highlights.",
          get: (c: PhongMaterialComponent) => c.specularMap,
          set: (c, v) => {
            c.specularMap = v as any;
          },
        },
        {
          key: "aoMap",
          label: "AO Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para Ambient Occlusion map (AO). Añade sombreado en cavidades.",
          get: (c: PhongMaterialComponent) => c.aoMap,
          set: (c, v) => {
            c.aoMap = v as any;
          },
        },
        {
          key: "bumpMap",
          label: "Bump Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para Bump map. Simula irregularidades de altura simples.",
          get: (c: PhongMaterialComponent) => c.bumpMap,
          set: (c, v) => {
            c.bumpMap = v as any;
          },
        },
        {
          key: "envMap",
          label: "Env Map",
          type: "texture",
          nullable: true,
          description: "ID del catálogo para environment map (reflejos). Ideal para materiales reflectantes.",
          get: (c: PhongMaterialComponent) => c.envMap,
          set: (c, v) => {
            c.envMap = v as any;
          },
        },
      ],
    },
  };

  private _color?: string | number;
  private _specular?: string | number;
  private _shininess?: number;
  private _emissive?: string | number;
  private _transparent?: boolean;
  private _opacity?: number;
  private _texture?: string;
  private _normalMap?: string;
  private _specularMap?: string;
  private _aoMap?: string;
  private _bumpMap?: string;
  private _envMap?: string;

  constructor(params: Partial<PhongMaterialComponent> = {}) {
    super();
    this._color = (params as any).color;
    this._specular = (params as any).specular;
    this._shininess = (params as any).shininess;
    this._emissive = (params as any).emissive;
    this._transparent = (params as any).transparent;
    this._opacity = (params as any).opacity;
    this._texture = (params as any).texture;
    this._normalMap = (params as any).normalMap;
    this._specularMap = (params as any).specularMap;
    this._aoMap = (params as any).aoMap;
    this._bumpMap = (params as any).bumpMap;
    this._envMap = (params as any).envMap;
  }

  get color() {
    return this._color;
  }
  set color(v: string | number | undefined) {
    this._color = v;
    this.notifyChanged();
  }
  get specular() {
    return this._specular;
  }
  set specular(v: string | number | undefined) {
    this._specular = v;
    this.notifyChanged();
  }
  get shininess() {
    return this._shininess;
  }
  set shininess(v: number | undefined) {
    this._shininess = v;
    this.notifyChanged();
  }
  get emissive() {
    return this._emissive;
  }
  set emissive(v: string | number | undefined) {
    this._emissive = v;
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
  get specularMap() {
    return this._specularMap;
  }
  set specularMap(v: string | undefined) {
    this._specularMap = v;
    this.notifyChanged();
  }
  get aoMap() {
    return this._aoMap;
  }
  set aoMap(v: string | undefined) {
    this._aoMap = v;
    this.notifyChanged();
  }
  get bumpMap() {
    return this._bumpMap;
  }
  set bumpMap(v: string | undefined) {
    this._bumpMap = v;
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

export default PhongMaterialComponent;
