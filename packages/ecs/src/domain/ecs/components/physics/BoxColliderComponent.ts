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
    unique: true,
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
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c) => c.halfExtents.x,
          set: (c, v) => {
            c.halfExtents.x = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "halfExtents.y",
          label: "Half Extents Y",
          type: "number",
          default: 0.5,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c) => c.halfExtents.y,
          set: (c, v) => {
            c.halfExtents.y = Number(v);
            c.notifyChanged();
          },
        },
        {
          key: "halfExtents.z",
          label: "Half Extents Z",
          type: "number",
          default: 0.5,
          min: 0.01,
          max: 1000,
          step: 0.01,
          get: (c) => c.halfExtents.z,
          set: (c, v) => {
            c.halfExtents.z = Number(v);
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
    description: "Box collider (cuboid) defined by half-extents.",
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
    if (!(he.x > 0 && he.y > 0 && he.z > 0)) errors.push("Box halfExtents must be > 0");
    return errors;
  }
}

export default BoxColliderComponent;
