import { Component } from '../core/Component';
import type { ComponentMetadata } from '../core/ComponentMetadata';
import { getCurrentEcsWorld } from '../core/EcsWorldContext';
import * as THREE from 'three';

export class LookAtEntityComponent extends Component {
  readonly type = 'lookAtEntity';
  readonly metadata: ComponentMetadata = {
    type: 'lookAtEntity',
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        { key: 'targetEntityId', label: 'Target', get: (c: LookAtEntityComponent) => c.targetEntityId, set: (c, v) => { c.targetEntityId = String(v || ''); c.notifyChanged(); } },
        { key: 'followSpeed', label: 'Follow Speed', get: (c: LookAtEntityComponent) => c.followSpeed, set: (c, v) => { c.followSpeed = v === undefined ? undefined : Number(v); c.notifyChanged(); } },
        { key: 'offset', label: 'Offset', get: (c: LookAtEntityComponent) => c.offset, set: (c, v) => { c.offset = v as any; c.notifyChanged(); } },
        { key: 'lookAtOffset', label: 'LookAt Offset', get: (c: LookAtEntityComponent) => c.lookAtOffset, set: (c, v) => { c.lookAtOffset = v as any; c.notifyChanged(); } },
      ],
    },
  };

  targetEntityId: string;
  followSpeed?: number;
  offset?: [number, number, number];
  lookAtOffset?: [number, number, number];

  constructor(params: { targetEntityId: string; offset?: [number, number, number] }) {
    super();
    this.targetEntityId = params.targetEntityId;
    this.offset = params.offset;
  }

  update(dt: number): void {
    if (!this.enabled) return;
    const world = getCurrentEcsWorld();
    if (!world) return;
    const target = world.getEntity(this.targetEntityId);
    if (!target) return;
    const selfId = this.getEntityId();
    if (!selfId) return;
    const self = world.getEntity(selfId);
    if (!self) return;

    // compute lookAt position (with optional lookAtOffset)
    const targetPos = target.transform.worldPosition.clone();
    if (this.lookAtOffset) targetPos.add(new THREE.Vector3(...this.lookAtOffset));

    // optional follow with offset (offset is applied relative to lookAt position)
    if (this.followSpeed !== undefined && this.offset) {
      const desired = targetPos.clone().add(new THREE.Vector3(...this.offset));
      const cur = self.transform.worldPosition.clone();
      const secs = dt / 1000;
      const t = Math.min(1, this.followSpeed * secs);
      const next = cur.lerp(desired, t);
      self.transform.setPosition(next.x, next.y, next.z);
    }

    // always look at the target position (after lookAtOffset applied)
    self.transform.lookAt(targetPos);
  }
}

export default LookAtEntityComponent;
