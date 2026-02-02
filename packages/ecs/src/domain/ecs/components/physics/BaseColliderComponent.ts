import { Component } from "../../core/Component";

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
}

export function isColliderComponentType(type: string): type is ColliderComponentType {
  return (COLLIDER_COMPONENT_TYPES as readonly string[]).includes(type);
}

export default BaseColliderComponent;
