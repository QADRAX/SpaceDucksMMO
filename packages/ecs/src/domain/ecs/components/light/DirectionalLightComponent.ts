import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseLightComponent from "./BaseLightComponent";

export class DirectionalLightComponent extends BaseLightComponent {
  readonly type = "directionalLight";
  readonly metadata: ComponentMetadata = {
    type: "directionalLight",
    label: "Directional Light",
    description: "Simulates sunlight or distant light sources. All light rays are parallel and come from the same direction. Position affects the light direction.",
    category: "Lighting",
    icon: "Sun",
    unique: true,
    requires: [],
    conflicts: ["ambientLight", "pointLight", "spotLight", "light"],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
          description: "The color of the directional light.",
          type: "color",
          default: "#ffffff",
          get: (c: DirectionalLightComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "intensity",
          label: "Intensity",
          description: "The brightness multiplier of the directional light.",
          type: "number",
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: DirectionalLightComponent) => c.intensity,
          set: (c, v) => {
            c.intensity = Number(v);
          },
        },
        {
          key: "castShadow",
          label: "Cast Shadow",
          description: "Whether this light should cast shadows on other objects.",
          type: "boolean",
          default: false,
          get: (c: DirectionalLightComponent) => c.castShadow,
          set: (c, v) => {
            c.castShadow = Boolean(v);
          },
        },
      ],
    },
  };

  private _color?: string | number;
  private _intensity?: number;
  private _castShadow?: boolean;

  constructor(params: Partial<DirectionalLightComponent> = {}) {
    super();
    this._color = (params as any).color ?? "#ffffff";
    this._intensity = (params as any).intensity ?? 1;
    this._castShadow = (params as any).castShadow ?? false;
  }

  get color(): string | number | undefined {
    return this._color;
  }

  set color(v: string | number | undefined) {
    this._color = v;
    this.notifyChanged();
  }

  get intensity(): number | undefined {
    return this._intensity;
  }

  set intensity(v: number | undefined) {
    this._intensity = v;
    this.notifyChanged();
  }

  get castShadow(): boolean | undefined {
    return this._castShadow;
  }

  set castShadow(v: boolean | undefined) {
    this._castShadow = v;
    this.notifyChanged();
  }
}

export default DirectionalLightComponent;
