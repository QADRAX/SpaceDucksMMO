import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseLightComponent from "./BaseLightComponent";

export class DirectionalLightComponent extends BaseLightComponent {
  readonly type = "directionalLight";
  readonly metadata: ComponentMetadata = {
    type: "directionalLight",
    unique: true,
    requires: [],
    conflicts: ["ambientLight", "pointLight", "spotLight", "light"],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
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
