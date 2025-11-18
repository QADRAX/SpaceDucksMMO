import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";

export class CameraTargetComponent extends Component {
  readonly type = "cameraTarget";
  readonly metadata: ComponentMetadata = {
    type: "cameraTarget",
    unique: true,
    requires: ["cameraView"],
    conflicts: [],
    inspector: {
      fields: [
        { key: "targetEntityId", label: "Target Entity", get: (c: CameraTargetComponent) => c.targetEntityId, set: (c, v) => { c.setTarget(String(v || "")); } },
        { key: "followSpeed", label: "Follow Speed", get: (c: CameraTargetComponent) => c.followSpeed, set: (c, v) => { c.followSpeed = v === undefined ? undefined : Number(v); c.notifyChanged(); } },
        { key: "offset", label: "Offset", get: (c: CameraTargetComponent) => c.offset, set: (c, v) => { c.offset = v as any; c.notifyChanged(); } },
        { key: "lookAtOffset", label: "LookAt Offset", get: (c: CameraTargetComponent) => c.lookAtOffset, set: (c, v) => { c.lookAtOffset = v as any; c.notifyChanged(); } },
      ],
    },
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
