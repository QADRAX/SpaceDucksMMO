import type { ComponentMetadata } from "../../core/ComponentMetadata";
import BaseColliderComponent, { type ColliderCommonParams } from "./BaseColliderComponent";

export type SphereColliderParams = ColliderCommonParams & {
  radius?: number;
};

export class SphereColliderComponent extends BaseColliderComponent {
  readonly type = "sphereCollider";
  readonly metadata: ComponentMetadata<SphereColliderComponent> = {
    type: "sphereCollider",
    label: "Sphere Collider",
    description:
      "Sphere collider. Requires a RigidBody on this entity or an ancestor (compound). Colliders without a RigidBody owner are ignored by physics.",
    category: "Physics",
    icon: "Circle",
    unique: true,
    requiresInHierarchy: ["rigidBody"],
    conflicts: [
      "boxCollider",
      "capsuleCollider",
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
          default: 0.5,
          min: 0.01,
          max: 100,
          step: 0.01,
          description: "Sphere radius in world units.",
          get: (c) => c.radius,
          set: (c, v: number) => {
            c.radius = Number(v);
            c.notifyChanged();
          },
        },
        ...this.getCommonInspectorFields(),
      ],
    },
  };

  radius: number;
  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  constructor(params?: SphereColliderParams) {
    super();
    this.radius = params?.radius ?? 0.5;
    this.initCommon(params);
  }

  validate(): string[] {
    const errors: string[] = [];
    if (!(this.radius > 0)) errors.push("Sphere radius must be > 0");
    return errors;
  }
}

export default SphereColliderComponent;
