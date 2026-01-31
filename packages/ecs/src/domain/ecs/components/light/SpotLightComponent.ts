import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseLightComponent from "./BaseLightComponent";

export class SpotLightComponent extends BaseLightComponent {
  readonly type = "spotLight";
  readonly metadata: ComponentMetadata = {
    type: "spotLight",
    unique: true,
    requires: [],
    conflicts: ["ambientLight", "directionalLight", "pointLight", "light"],
    inspector: {
      fields: [
        {
          key: "color",
          label: "Color",
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
