import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseColliderComponent, { type ColliderCommonParams } from "./BaseColliderComponent";

export type CapsuleColliderParams = ColliderCommonParams & {
  radius?: number;
  halfHeight?: number;
};

export class CapsuleColliderComponent extends BaseColliderComponent {
  readonly type = "capsuleCollider";
  readonly metadata: ComponentMetadata<CapsuleColliderComponent> = {
    type: "capsuleCollider",
    unique: true,
    requiresInHierarchy: ["rigidBody"],
    conflicts: [
      "sphereCollider",
      "boxCollider",
      "cylinderCollider",
      "coneCollider",
      "terrainCollider",
    ],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          type: "number",
          default: 0.3,
          min: 0.01,
          max: 100,
          step: 0.01,
          description: "Capsule radius (the radius of the spherical ends).",
          get: (c) => c.radius,
          set: (c, v: number) => {
            c.radius = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "halfHeight",
          label: "Half Height",
          type: "number",
          default: 0.7,
          min: 0,
          max: 100,
          step: 0.01,
          description:
            "Half-height of the capsule's cylindrical section. Total height = 2*(halfHeight + radius).",
          get: (c) => c.halfHeight,
          set: (c, v: number) => {
            c.halfHeight = Number(v);
            c.notifyChanged();
          },
        },
        ...this.getCommonInspectorFields(),
      ],
    },
    description:
      "Capsule collider (Y axis) defined by radius and half-height. Requires a RigidBody on this entity or an ancestor (compound). Colliders without a RigidBody owner are ignored by physics.",
  };

  radius: number;
  halfHeight: number;
  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  constructor(params?: CapsuleColliderParams) {
    super();
    this.radius = params?.radius ?? 0.3;
    this.halfHeight = params?.halfHeight ?? 0.7;
    this.initCommon(params);
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!(this.radius > 0)) errors.push("Capsule radius must be > 0");
    if (!(this.halfHeight >= 0)) errors.push("Capsule halfHeight must be >= 0");
    return errors;
  }
}

export default CapsuleColliderComponent;
