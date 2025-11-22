import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import * as THREE from "three";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";

export class LookAtPointComponent extends Component {
  readonly type = "lookAtPoint";
  readonly metadata: ComponentMetadata = {
    type: "lookAtPoint",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "targetPoint",
          label: "Target Point",
          type: "vector",
          description: "Point in space to look at",
          get: (c: LookAtPointComponent) => c.targetPoint,
          set: (c, v) => {
            c.targetPoint = v as any;
            c.notifyChanged();
          },
        },
      ],
    },
  };

  targetPoint: [number, number, number];

  constructor(params: { targetPoint: [number, number, number] }) {
    super();
    this.targetPoint = params.targetPoint;
  }

  update(dt: number): void {
    if (!this.enabled) return;
    const world = getCurrentEcsWorld();
    if (!world) return;
    const selfId = this.getEntityId();
    if (!selfId) return;
    const self = world.getEntity(selfId);
    if (!self) return;

    const v = new THREE.Vector3(...this.targetPoint);
    self.transform.lookAt(v);
  }
}

export default LookAtPointComponent;
