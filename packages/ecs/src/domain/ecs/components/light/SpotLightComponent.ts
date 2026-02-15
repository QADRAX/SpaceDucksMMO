import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseLightComponent from "./BaseLightComponent";

export class SpotLightComponent extends BaseLightComponent {
  readonly type = "spotLight";
  readonly metadata: ComponentMetadata = {
    type: "spotLight",
    label: "Spot Light",
    description: "Emits light in a cone shape from a single point. Position and rotation affect the light direction and cone orientation.",
    category: "Lighting",
    icon: "Flashlight",
    unique: true,
    requires: [],
    conflicts: ["ambientLight", "directionalLight", "pointLight", "light"],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
          description: "The color of the spot light.",
          type: "color",
          default: "#ffffff",
          get: (c: SpotLightComponent) => c.color,
          set: (c, v) => {
            c.color = v as any;
          },
        },
        {
          key: "intensity",
          label: "Intensity",
          description: "The brightness multiplier of the spot light.",
          type: "number",
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: SpotLightComponent) => c.intensity,
          set: (c, v) => {
            c.intensity = Number(v);
          },
        },
        {
          key: "distance",
          label: "Distance",
          description: "Maximum distance the light reaches. 0 means infinite range.",
          type: "number",
          default: 0,
          min: 0,
          max: 1000,
          step: 1,
          get: (c: SpotLightComponent) => c.distance,
          set: (c, v) => {
            c.distance = Number(v);
          },
        },
        {
          key: "angle",
          label: "Angle",
          description: "The angle of the spotlight cone in radians.",
          type: "number",
          default: 0.5,
          min: 0,
          max: Math.PI,
          step: 0.01,
          get: (c: SpotLightComponent) => c.angle,
          set: (c, v) => {
            c.angle = Number(v);
          },
        },
        {
          key: "penumbra",
          label: "Penumbra",
          description: "The softness of the spotlight edge. 0 is sharp, 1 is very soft.",
          type: "number",
          default: 0,
          min: 0,
          max: 1,
          step: 0.01,
          get: (c: SpotLightComponent) => c.penumbra,
          set: (c, v) => {
            c.penumbra = Number(v);
          },
        },
        {
          key: "decay",
          label: "Decay",
          description: "How quickly the light intensity decreases with distance.",
          type: "number",
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: SpotLightComponent) => c.decay,
          set: (c, v) => {
            c.decay = Number(v);
          },
        },
      ],
    },
  };

  private _color?: string | number;
  private _intensity?: number;
  private _distance?: number;
  private _angle?: number;
  private _penumbra?: number;
  private _decay?: number;

  constructor(params: Partial<SpotLightComponent> = {}) {
    super();
    this._color = (params as any).color ?? "#ffffff";
    this._intensity = (params as any).intensity ?? 1;
    this._distance = (params as any).distance ?? 0;
    this._angle = (params as any).angle ?? 0.5;
    this._penumbra = (params as any).penumbra ?? 0;
    this._decay = (params as any).decay ?? 1;
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

  get distance(): number | undefined {
    return this._distance;
  }

  set distance(v: number | undefined) {
    this._distance = v;
    this.notifyChanged();
  }

  get angle(): number | undefined {
    return this._angle;
  }

  set angle(v: number | undefined) {
    this._angle = v;
    this.notifyChanged();
  }

  get penumbra(): number | undefined {
    return this._penumbra;
  }

  set penumbra(v: number | undefined) {
    this._penumbra = v;
    this.notifyChanged();
  }

  get decay(): number | undefined {
    return this._decay;
  }

  set decay(v: number | undefined) {
    this._decay = v;
    this.notifyChanged();
  }
}

export default SpotLightComponent;
