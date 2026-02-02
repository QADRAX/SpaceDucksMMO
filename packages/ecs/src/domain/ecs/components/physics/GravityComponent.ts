import type { ComponentMetadata } from "../../core/ComponentMetadata";
import { Component } from "../../core/Component";

export interface GravityParams {
  /** Gravity vector in world units / s^2. Default: (0, -9.81, 0). */
  gravity?: [number, number, number];
}

export class GravityComponent extends Component {
  readonly type = "gravity";
  readonly metadata: ComponentMetadata<GravityComponent> = {
    type: "gravity",
    unique: true,
    inspector: {
      fields: [
        {
          key: "gravity",
          label: "Gravity",
          type: "vector",
          default: [0, -9.81, 0],
          get: (c) => c.gravity,
          set: (c, v) => {
            const arr = Array.isArray(v) ? v : [0, -9.81, 0];
            c.gravity = [Number(arr[0]), Number(arr[1]), Number(arr[2])];
            c.notifyChanged();
          },
        },
      ],
    },
    description: "Defines scene gravity. Physics system will use the first enabled GravityComponent it finds.",
  };

  gravity: [number, number, number];

  constructor(params?: GravityParams) {
    super();
    this.gravity = params?.gravity ?? [0, -9.81, 0];
  }
}

export default GravityComponent;
