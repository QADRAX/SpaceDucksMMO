import { BaseMaterialComponent } from './BaseMaterialComponent';
import type { ComponentMetadata } from '../../core/ComponentMetadata';

export class StandardMaterialComponent extends BaseMaterialComponent {
  readonly type = "standardMaterial";
  readonly metadata: ComponentMetadata = {
    type: "standardMaterial",
    description: "Three.js standard PBR material. Simulates realistic surfaces using parameters like color, metalness, roughness, emissive, transparency and textures. Maps to THREE.MeshStandardMaterial.",
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
          description: "Base color of the material. Visible when no albedo texture is set. Maps to THREE.MeshStandardMaterial.color.",
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
          description: "How metallic the surface appears. 0 = dielectric (plastic/wood), 1 = metallic. Maps to THREE.MeshStandardMaterial.metalness.",
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
          description: "Surface roughness. 0 = mirror-like smooth, 1 = very rough. Maps to THREE.MeshStandardMaterial.roughness.",
          get: (c: StandardMaterialComponent) => c.roughness,
          set: (c, v) => {
            c.roughness = v ? Number(v) : undefined;
          },
        },
        {
          key: "aoMap",
          label: "AO Map",
          type: "texture",
          nullable: true,
          description:
            "Catalog id for Ambient Occlusion map. Darkens crevices and occluded areas. Mapped to THREE.MeshStandardMaterial.aoMap.",
          get: (c: StandardMaterialComponent) => c.aoMap,
          set: (c, v) => {
            c.aoMap = v as any;
          },
        },
        {
          key: "roughnessMap",
          label: "Roughness Map",
          type: "texture",
          nullable: true,
          description:
            "Catalog id for Roughness map. Controls per-pixel roughness. Dark = smooth (more reflective), Bright = rough (more matte). Mapped to THREE.MeshStandardMaterial.roughnessMap.",
          get: (c: StandardMaterialComponent) => c.roughnessMap,
          set: (c, v) => {
            c.roughnessMap = v as any;
          },
        },
        {
          key: "metalnessMap",
          label: "Metalness Map",
          type: "texture",
          nullable: true,
          description:
            "Catalog id for Metalness map. Defines which areas behave like metal (1) vs dielectric (0). Mapped to THREE.MeshStandardMaterial.metalnessMap.",
          get: (c: StandardMaterialComponent) => c.metalnessMap,
          set: (c, v) => {
            c.metalnessMap = v as any;
          },
        },
        {
          key: "emissive",
          label: "Emissive",
          type: "color",
          default: "#d8d8d8ff",
          nullable: true,
          description: "Color the material emits by itself. Does not illuminate other objects. Maps to THREE.MeshStandardMaterial.emissive.",
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
          description: "Multiplies the emissive color. 0 = no emission, 1 = use color as-is, >1 = brighter. Maps to THREE.MeshStandardMaterial.emissiveIntensity.",
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
          description: "Allows the material to be transparent. When enabled, opacity affects visibility. Maps to THREE.MeshStandardMaterial.transparent.",
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
          description: "Controls how transparent the material is. 1 = opaque, 0 = fully transparent. Only effective if 'Transparent' is enabled. Maps to THREE.MeshStandardMaterial.opacity.",
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
          description: "Catalog id for an albedo (base color) texture (e.g. 'planets/moon'). When set, it replaces the base color. The renderer resolves the id to an asset path.",
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
          description: "Catalog id for a normal map. Enhances perceived surface detail without changing geometry. The renderer will resolve the id.",
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
          description: "Catalog id for an environment map (reflections). Used to simulate environment reflections. The renderer will pick the appropriate asset.",
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
  private _aoMap?: string;
  private _roughnessMap?: string;
  private _metalnessMap?: string;

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
    this._aoMap = (params as any).aoMap;
    this._roughnessMap = (params as any).roughnessMap;
    this._metalnessMap = (params as any).metalnessMap;
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
  get aoMap() {
    return this._aoMap;
  }
  set aoMap(v: string | undefined) {
    this._aoMap = v;
    this.notifyChanged();
  }

  get roughnessMap() {
    return this._roughnessMap;
  }
  set roughnessMap(v: string | undefined) {
    this._roughnessMap = v;
    this.notifyChanged();
  }

  get metalnessMap() {
    return this._metalnessMap;
  }
  set metalnessMap(v: string | undefined) {
    this._metalnessMap = v;
    this.notifyChanged();
  }
}

export default StandardMaterialComponent;
