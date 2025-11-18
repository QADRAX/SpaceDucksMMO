import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export type GeometryParameters =
  | {
      type: "sphere";
      radius: number;
      widthSegments?: number;
      heightSegments?: number;
    }
  | { type: "box"; width: number; height: number; depth: number }
  | {
      type: "plane";
      width: number;
      height: number;
      widthSegments?: number;
      heightSegments?: number;
    }
  | {
      type: "cylinder";
      radiusTop: number;
      radiusBottom: number;
      height: number;
      radialSegments?: number;
    }
  | { type: "cone"; radius: number; height: number; radialSegments?: number }
  | {
      type: "torus";
      radius: number;
      tube: number;
      radialSegments?: number;
      tubularSegments?: number;
    }
  | {
      type: "custom";
      /* token; infra provides actual THREE geometry */ key: string;
    };

export class GeometryComponent extends Component {
  readonly type = "geometry";
  readonly metadata: ComponentMetadata = {
    type: "geometry",
    unique: true,
    requires: [],
    conflicts: ["skybox"],
    inspector: {
      fields: [
        { key: "parameters", label: "Parameters", get: (c: GeometryComponent) => c.parameters },
      ],
    },
  };
  private _parameters: GeometryParameters;
  constructor(parameters: GeometryParameters) {
    super();
    this._parameters = parameters;
  }
  get parameters(): GeometryParameters {
    return this._parameters;
  }
  set parameters(value: GeometryParameters) {
    this._parameters = value;
    this.notifyChanged();
  }
}

export default GeometryComponent;
