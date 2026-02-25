import { Component } from "../core/Component";
import type { ComponentMetadata } from "../core/ComponentMetadata";
import { getCurrentEcsWorld } from "../core/EcsWorldContext";
import type { Vec3Like } from "../core/MathTypes";

/**
 * @deprecated Use ScriptComponent with 'builtin://look_at_entity.lua' instead.
 * Automatically migrated during snapshot deserialization.
 */
export class LookAtEntityComponent extends Component {
  readonly type = "lookAtEntity";
  readonly metadata: ComponentMetadata = {
    type: "lookAtEntity",
    label: "Look At Entity",
    description: "Rotates the entity to face another entity, with optional smooth following and offsets.",
    category: "Behavior",
    icon: "Target",
    unique: true,
    requires: [],
    conflicts: [],
    inspector: {
      fields: [
        {
          key: "targetEntityId",
          type: "reference",
          label: "Target",
          description: "The entity to look at.",
          get: (c: LookAtEntityComponent) => c.targetEntityId,
          set: (c, v) => {
            c.targetEntityId = String(v || "");
            c.notifyChanged();
          },
        },
        {
          key: "followSpeed",
          label: "Follow Speed",
          description: "Speed for smooth rotation following. If null, instant rotation.",
          type: "number",
          nullable: true,
          get: (c: LookAtEntityComponent) => c.followSpeed,
          set: (c, v) => {
            c.followSpeed = v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "offset",
          label: "Offset",
          description: "Position offset from the target entity.",
          type: "vector",
          nullable: true,
          get: (c: LookAtEntityComponent) => c.offset,
          set: (c, v) => {
            c.offset = v as any;
            c.notifyChanged();
          },
        },
        {
          key: "lookAtOffset",
          label: "LookAt Offset",
          description: "Offset from the target entity's position to look at.",
          type: "vector",
          nullable: true,
          get: (c: LookAtEntityComponent) => c.lookAtOffset,
          set: (c, v) => {
            c.lookAtOffset = v as any;
            c.notifyChanged();
          },
        },
      ],
    },
  };

  targetEntityId: string;
  followSpeed?: number;
  offset?: [number, number, number];
  lookAtOffset?: [number, number, number];

  constructor(params: {
    targetEntityId: string;
    offset?: [number, number, number];
  }) {
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
    const tp = target.transform.worldPosition;
    const targetPos: Vec3Like = {
      x: tp.x + (this.lookAtOffset?.[0] ?? 0),
      y: tp.y + (this.lookAtOffset?.[1] ?? 0),
      z: tp.z + (this.lookAtOffset?.[2] ?? 0),
    };

    // optional follow with offset (offset is applied relative to lookAt position)
    if (this.followSpeed !== undefined && this.offset) {
      const desired = {
        x: targetPos.x + this.offset[0],
        y: targetPos.y + this.offset[1],
        z: targetPos.z + this.offset[2],
      };
      const cur = self.transform.worldPosition;
      const secs = dt / 1000;
      const t = Math.min(1, this.followSpeed * secs);
      const next = {
        x: cur.x + (desired.x - cur.x) * t,
        y: cur.y + (desired.y - cur.y) * t,
        z: cur.z + (desired.z - cur.z) * t,
      };
      self.transform.setPosition(next.x, next.y, next.z);
    }

    // always look at the target position (after lookAtOffset applied)
    self.transform.lookAt(targetPos);
  }
}

export default LookAtEntityComponent;
