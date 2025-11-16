import { Component } from '../core/Component';
import type { ComponentMetadata } from '../core/ComponentMetadata';

export class CameraViewComponent extends Component {
  readonly type = 'cameraView';
  readonly metadata: ComponentMetadata = { type: 'cameraView', unique: true, requires: [], conflicts: [] };
  fov: number; near: number; far: number; aspect: number;
  constructor(params: { fov?: number; near?: number; far?: number; aspect?: number }) {
    super(); this.fov = params.fov ?? 60; this.near = params.near ?? 0.1; this.far = params.far ?? 1000; this.aspect = params.aspect ?? 1;
  }
  setFov(v: number){ this.fov = v; this.notifyChanged(); }
}

export default CameraViewComponent;