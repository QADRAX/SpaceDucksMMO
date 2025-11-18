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
        { key: "fov", label: "FOV", get: (c: CameraViewComponent) => c.fov, set: (c, v) => { c.setFov(Number(v)); } },
        { key: "near", label: "Near", get: (c: CameraViewComponent) => c.near, set: (c, v) => { c.near = Number(v); c.notifyChanged(); } },
        { key: "far", label: "Far", get: (c: CameraViewComponent) => c.far, set: (c, v) => { c.far = Number(v); c.notifyChanged(); } },
        { key: "aspect", label: "Aspect", get: (c: CameraViewComponent) => c.aspect, set: (c, v) => { c.aspect = Number(v); c.notifyChanged(); } },
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
