import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseColliderComponent, { type ColliderCommonParams } from "./BaseColliderComponent";

export type BoxHalfExtents = { x: number; y: number; z: number };

export type BoxColliderParams = ColliderCommonParams & {
  halfExtents?: Partial<BoxHalfExtents>;
};

export class BoxColliderComponent extends BaseColliderComponent {
  readonly type = "boxCollider";
  readonly metadata: ComponentMetadata<BoxColliderComponent> = {
    type: "boxCollider",
    label: "Box Collider",
    description:
      "Box collider (cuboid) defined by half-extents. Requires a RigidBody on this entity or an ancestor (compound). Colliders without a RigidBody owner are ignored by physics.",
    category: "Physics",
    icon: "Box",
    unique: true,
    requiresInHierarchy: ["rigidBody"],
    conflicts: [
      "sphereCollider",
      "capsuleCollider",
      "cylinderCollider",
      "coneCollider",
      "terrainCollider",
    ],
    inspector: {
      fields: [
        {
          key: "halfExtents.x",
          label: "Half Extents X",
          type: "number",
          default: 0.5,
          min: 0,
          max: 100,
          step: 0.01,
          description: "Half-size of the box along the X axis (width/2).",
          get: (c) => c.halfExtents.x,
          set: (c, v: number) => {
            c.halfExtents.x = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "halfExtents.y",
          label: "Half Extents Y",
          type: "number",
          default: 0.5,
          min: 0,
          max: 100,
          step: 0.01,
          description: "Half-size of the box along the Y axis (height/2).",
          get: (c) => c.halfExtents.y,
          set: (c, v: number) => {
            c.halfExtents.y = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "halfExtents.z",
          label: "Half Extents Z",
          type: "number",
          default: 0.5,
          min: 0,
          max: 100,
          step: 0.01,
          description: "Half-size of the box along the Z axis (depth/2).",
          get: (c) => c.halfExtents.z,
          set: (c, v: number) => {
            c.halfExtents.z = Number(v);
            c.notifyChanged();
          },
        },
        ...this.getCommonInspectorFields(),
      ],
    },
  };

  halfExtents: BoxHalfExtents;
  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  constructor(params?: BoxColliderParams) {
    super();
    this.halfExtents = {
      x: params?.halfExtents?.x ?? 0.5,
      y: params?.halfExtents?.y ?? 0.5,
      z: params?.halfExtents?.z ?? 0.5,
    };
    this.initCommon(params);
  }

  validate(): string[] {
    const errors: string[] = [];
    const he = this.halfExtents;
    if (he.x < 0 || he.y < 0 || he.z < 0) errors.push("Box halfExtents must be >= 0");
    if (he.x === 0 && he.y === 0 && he.z === 0) errors.push("Box halfExtents cannot all be 0");
    return errors;
  }
}

export default BoxColliderComponent;
