import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseLightComponent from "./BaseLightComponent";

export class AmbientLightComponent extends BaseLightComponent {
  readonly type = "ambientLight";
  readonly metadata: ComponentMetadata = {
    type: "ambientLight",
    label: "Ambient Light",
    description: "Provides uniform illumination from all directions. Affects all objects in the scene equally, creating a base lighting level.",
    category: "Lighting",
    icon: "Sun",
    unique: true,
    requires: [],
    conflicts: ["directionalLight", "pointLight", "spotLight", "light"],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
          description: "The color of the ambient light.",
          type: "color",
          default: "#ffffff",
          get: (c: AmbientLightComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "intensity",
          label: "Intensity",
          description: "The brightness multiplier of the ambient light.",
          type: "number",
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: AmbientLightComponent) => c.intensity,
          set: (c, v) => {
            c.intensity = Number(v);
          },
        },
      ],
    },
  };

  private _color?: string | number;
  private _intensity?: number;

  constructor(params: Partial<AmbientLightComponent> = {}) {
    super();
    this._color = (params as any).color ?? "#ffffff";
    this._intensity = (params as any).intensity ?? 1;
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
}

export default AmbientLightComponent;
