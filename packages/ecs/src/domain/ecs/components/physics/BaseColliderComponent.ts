import { Component } from "../../core/Component";
import type { InspectorFieldConfig } from "../../core/ComponentMetadata";

import type { BoxColliderComponent } from "./BoxColliderComponent";
import type { CapsuleColliderComponent } from "./CapsuleColliderComponent";
import type { ConeColliderComponent } from "./ConeColliderComponent";
import type { CylinderColliderComponent } from "./CylinderColliderComponent";
import type { SphereColliderComponent } from "./SphereColliderComponent";
import type { TerrainColliderComponent } from "./TerrainColliderComponent";

export type ColliderComponentType =
  | "sphereCollider"
  | "boxCollider"
  | "capsuleCollider"
  | "cylinderCollider"
  | "coneCollider"
  | "terrainCollider";

export type AnyColliderComponent =
  | SphereColliderComponent
  | BoxColliderComponent
  | CapsuleColliderComponent
  | CylinderColliderComponent
  | ConeColliderComponent
  | TerrainColliderComponent;

export const COLLIDER_COMPONENT_TYPES: readonly ColliderComponentType[] = [
  "sphereCollider",
  "boxCollider",
  "capsuleCollider",
  "cylinderCollider",
  "coneCollider",
  "terrainCollider",
] as const;

export type ColliderCommonParams = {
  friction?: number;
  restitution?: number;
  isSensor?: boolean;
};

export abstract class BaseColliderComponent extends Component {
  abstract readonly type: ColliderComponentType;

  friction?: number;
  restitution?: number;
  isSensor?: boolean;

  protected initCommon(params?: ColliderCommonParams): void {
    this.friction = params?.friction;
    this.restitution = params?.restitution;
    this.isSensor = params?.isSensor;
  }

  /** Shared inspector fields for collider common parameters (friction/restitution/isSensor). */
  protected getCommonInspectorFields<T extends BaseColliderComponent>(this: T): InspectorFieldConfig<T>[] {
    return [
      {
        key: "friction",
        label: "Friction",
        type: "number",
        nullable: true,
        default: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        description:
          "Surface friction coefficient. Higher values reduce sliding. 0 = frictionless. (Backend-dependent)",
        get(c) {
          return c.friction;
        },
        set(c, v: number | null | undefined) {
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
        description:
          "Bounciness coefficient. 0 = no bounce, 1 = perfectly elastic. (Backend-dependent)",
        get(c) {
          return c.restitution;
        },
        set(c, v: number | null | undefined) {
          c.restitution = v === null || v === undefined ? undefined : Number(v);
          c.notifyChanged();
        },
      },
      {
        key: "isSensor",
        label: "Is Sensor",
        type: "boolean",
        default: false,
        description:
          "If true, the collider only reports overlaps/events and does not physically block other bodies.",
        get(c) {
          return !!c.isSensor;
        },
        set(c, v: boolean) {
          c.isSensor = !!v;
          c.notifyChanged();
        },
      },
    ];
  }
}

export function isColliderComponentType(type: string): type is ColliderComponentType {
  return (COLLIDER_COMPONENT_TYPES as readonly string[]).includes(type);
}

export default BaseColliderComponent;
