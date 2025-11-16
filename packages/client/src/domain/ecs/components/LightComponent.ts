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
