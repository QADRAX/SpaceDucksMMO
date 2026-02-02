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
          max: 1000,
          step: 0.01,
          get: (c) => c.radius,
          set: (c, v) => {
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
          max: 1000,
          step: 0.01,
          get: (c) => c.halfHeight,
          set: (c, v) => {
            c.halfHeight = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "friction",
          label: "Friction",
          type: "number",
          nullable: true,
          default: 0.5,
          min: 0,
          max: 10,
          step: 0.01,
          get: (c) => c.friction,
          set: (c, v) => {
            c.friction = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "restitution",
          label: "Restitution",
          type: "number",
          nullable: true,
          default: 0,
          min: 0,
          max: 1,
          step: 0.01,
          get: (c) => c.restitution,
          set: (c, v) => {
            c.restitution = v === null || v === undefined ? undefined : Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "isSensor",
          label: "Is Sensor",
          type: "boolean",
          default: false,
          get: (c) => !!c.isSensor,
          set: (c, v) => {
            c.isSensor = !!v;
            c.notifyChanged();
          },
        },
      ],
    },
    description: "Capsule collider (Y axis) defined by radius and half-height.",
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
