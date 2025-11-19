import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export type LightType = "ambient" | "directional" | "point" | "spot";
export type LightParams =
  | { type: "ambient"; color?: string | number; intensity?: number }
  | { type: "directional"; color?: string | number; intensity?: number }
  | {
      type: "point";
      color?: string | number;
      intensity?: number;
      distance?: number;
      decay?: number;
    }
  | {
      type: "spot";
      color?: string | number;
      intensity?: number;
      distance?: number;
      angle?: number;
      penumbra?: number;
      decay?: number;
    };

export class LightComponent extends Component {
  readonly type = "light";
  readonly metadata: ComponentMetadata = {
    type: "light",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "type",
          label: "Type",
          type: "enum",
          options: [
            { value: "ambient", label: "Ambient" },
            { value: "directional", label: "Directional" },
            { value: "point", label: "Point" },
            { value: "spot", label: "Spot" },
          ],
          get: (c: LightComponent) => c.params.type,
          set: (c, v) => {
            c.params = { ...(c.params as any), type: String(v) } as any;
            c.notifyChanged();
          },
        },
        {
          key: "color",
          label: "Color",
          type: "color",
          nullable: true,
          default: "#ffffff",
          get: (c: LightComponent) => (c.params as any).color,
          set: (c, v) => {
            c.setColor(v as any);
          },
        },
        {
          key: "intensity",
          label: "Intensity",
          type: "number",
          nullable: true,
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: LightComponent) => (c.params as any).intensity,
          set: (c, v) => {
            c.setIntensity(Number(v));
          },
        },
        {
          key: "distance",
          label: "Distance",
          type: "number",
          nullable: true,
          default: 0,
          min: 0,
          max: 1000,
          step: 1,
          get: (c: LightComponent) => (c.params as any).distance,
          set: (c, v) => {
            c.params = {
              ...(c.params as any),
              distance: v === undefined ? undefined : Number(v),
            } as any;
            c.notifyChanged();
          },
        },
        {
          key: "decay",
          label: "Decay",
          type: "number",
          nullable: true,
          default: 1,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c: LightComponent) => (c.params as any).decay,
          set: (c, v) => {
            c.params = {
              ...(c.params as any),
              decay: v === undefined ? undefined : Number(v),
            } as any;
            c.notifyChanged();
          },
        },
        {
          key: "angle",
          label: "Angle",
          type: "number",
          nullable: true,
          default: 0.5,
          min: 0,
          max: Math.PI,
          step: 0.01,
          get: (c: LightComponent) => (c.params as any).angle,
          set: (c, v) => {
            c.params = {
              ...(c.params as any),
              angle: v === undefined ? undefined : Number(v),
            } as any;
            c.notifyChanged();
          },
        },
        {
          key: "penumbra",
          label: "Penumbra",
          type: "number",
          nullable: true,
          default: 0,
          min: 0,
          max: 1,
          step: 0.01,
          get: (c: LightComponent) => (c.params as any).penumbra,
          set: (c, v) => {
            c.params = {
              ...(c.params as any),
              penumbra: v === undefined ? undefined : Number(v),
            } as any;
            c.notifyChanged();
          },
        },
      ],
    },
  };
  private _params: LightParams;
  constructor(params: LightParams) {
    super();
    this._params = params;
  }
  get params(): LightParams {
    return this._params;
  }
  set params(v: LightParams) {
    this._params = v;
    this.notifyChanged();
  }
  setColor(color: string | number) {
    this._params = { ...this._params, color } as LightParams;
    this.notifyChanged();
  }
  setIntensity(intensity: number) {
    this._params = { ...this._params, intensity } as LightParams;
    this.notifyChanged();
  }
}

export default LightComponent;
