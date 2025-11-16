import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export class CameraTargetComponent extends Component {
  readonly type = "cameraTarget";
  readonly metadata: ComponentMetadata = {
    type: "cameraTarget",
    unique: true,
    requires: ["cameraView"],
    conflicts: [],
  };
  targetEntityId: string;
  followSpeed?: number;
  offset?: [number, number, number];
  lookAtOffset?: [number, number, number];
  constructor(params: {
    targetEntityId: string;
    followSpeed?: number;
    offset?: [number, number, number];
    lookAtOffset?: [number, number, number];
  }) {
    super();
    this.targetEntityId = params.targetEntityId;
    this.followSpeed = params.followSpeed;
    this.offset = params.offset;
    this.lookAtOffset = params.lookAtOffset;
  }
  setTarget(id: string) {
    this.targetEntityId = id;
    this.notifyChanged();
  }
}

export default CameraTargetComponent;
