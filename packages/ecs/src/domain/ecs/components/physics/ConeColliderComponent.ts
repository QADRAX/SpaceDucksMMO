import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseColliderComponent, { type ColliderCommonParams } from "./BaseColliderComponent";

export type ConeColliderParams = ColliderCommonParams & {
  radius?: number;
  halfHeight?: number;
};

export class ConeColliderComponent extends BaseColliderComponent {
  readonly type = "coneCollider";
  readonly metadata: ComponentMetadata<ConeColliderComponent> = {
    type: "coneCollider",
    unique: true,
    requiresInHierarchy: ["rigidBody"],
    conflicts: [
      "sphereCollider",
      "boxCollider",
      "capsuleCollider",
      "cylinderCollider",
      "terrainCollider",
    ],
    inspector: {
      fields: [
        {
          key: "radius",
          label: "Radius",
          type: "number",
          default: 0.5,
          min: 0.01,
          max: 100,
          step: 0.01,
          description: "Cone base radius in world units.",
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
          default: 0.5,
          min: 0,
          max: 100,
          step: 0.01,
          description: "Half-height along Y. Total height = 2*halfHeight.",
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
      "Cone collider (Y axis) defined by radius and half-height. Requires a RigidBody on this entity or an ancestor (compound). Colliders without a RigidBody owner are ignored by physics.",
  };

  radius: number;
  halfHeight: number;
  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  constructor(params?: ConeColliderParams) {
    super();
    this.radius = params?.radius ?? 0.5;
    this.halfHeight = params?.halfHeight ?? 0.5;
    this.initCommon(params);
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!(this.radius > 0)) errors.push("Cone radius must be > 0");
    if (!(this.halfHeight >= 0)) errors.push("Cone halfHeight must be >= 0");
    return errors;
  }
}

export default ConeColliderComponent;
