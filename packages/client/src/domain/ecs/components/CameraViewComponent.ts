import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export class CameraViewComponent extends Component {
  readonly type = "cameraView";
  readonly metadata: ComponentMetadata = {
    type: "cameraView",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "fov",
          label: "FOV",
          type: "number",
          default: 60,
          min: 1,
          max: 180,
          step: 1,
          get: (c: CameraViewComponent) => c.fov,
          set: (c, v) => {
            c.setFov(Number(v));
          },
        },
        {
          key: "near",
          label: "Near",
          type: "number",
          default: 0.1,
          min: 0.01,
          max: 10,
          step: 0.01,
          get: (c: CameraViewComponent) => c.near,
          set: (c, v) => {
            c.near = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "far",
          label: "Far",
          type: "number",
          default: 1000,
          min: 1,
          max: 10000,
          step: 1,
          get: (c: CameraViewComponent) => c.far,
          set: (c, v) => {
            c.far = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "aspect",
          label: "Aspect",
          type: "number",
          default: 1,
          min: 0.1,
          max: 4,
          step: 0.01,
          get: (c: CameraViewComponent) => c.aspect,
          set: (c, v) => {
            c.aspect = Number(v);
            c.notifyChanged();
          },
        },
      ],
    },
  };
  fov: number;
  near: number;
  far: number;
  aspect: number;
  constructor(params: {
    fov?: number;
    near?: number;
    far?: number;
    aspect?: number;
  }) {
    super();
    this.fov = params.fov ?? 60;
    this.near = params.near ?? 0.1;
    this.far = params.far ?? 1000;
    this.aspect = params.aspect ?? 1;
  }
  setFov(v: number) {
    this.fov = v;
    this.notifyChanged();
  }
}

export default CameraViewComponent;
